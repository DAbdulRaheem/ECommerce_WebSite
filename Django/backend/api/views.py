from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db import transaction
from cloudinary.uploader import upload as cloud_upload
import jwt, datetime, os, json
import hashlib
import uuid

from .models import (Category, Product, ProductImage, UserProfile, Address,
                     Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, Review)
from .serializers import (CategorySerializer, ProductSerializer, ProductImageSerializer,
                          AddressSerializer, CartSerializer, CartItemSerializer, WishlistItemSerializer,
                          OrderSerializer, ReviewSerializer)

# ----------------------------
# UTILITY: Unified Data Parser
# ----------------------------
def get_request_data(request):
    """
    Helper function to get data from either JSON body or Form Data.
    Allows the frontend to send either format seamlessly.
    """
    if request.content_type == 'application/json':
        try:
            return json.loads(request.body)
        except json.JSONDecodeError:
            return {}
    else:
        # Return POST data (Form-Data / x-www-form-urlencoded)
        return request.POST

# ----------------------------
# JWT helpers
# ----------------------------
JWT_SECRET = getattr(settings, 'SECRET_KEY')
JWT_ALGO = 'HS256'
JWT_EXP_HOURS = 24

def generate_token(user):
    payload = {
        'user_id': user.id,
        'exp': datetime.datetime.now() + datetime.timedelta(hours=JWT_EXP_HOURS),
        'iat': datetime.datetime.now(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token_from_request(request):
    auth = request.headers.get('Authorization','')
    if not auth.startswith('Bearer '):
        return None
    token = auth.split(' ')[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user = User.objects.get(id=decoded['user_id'])
        return user
    except Exception:
        return None

# ----------------------------
# AUTH ENDPOINTS
# ----------------------------
@csrf_exempt
def user_register(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
    
    data = get_request_data(request) # <--- Unified Data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return JsonResponse({'error':'All fields required'}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error':'Username exists'}, status=400)
    
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user)
    token = generate_token(user)
    return JsonResponse({'message':'User created','token': token, 'username': user.username}, status=201)

@csrf_exempt
def user_login(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
        
    data = get_request_data(request)
    username = data.get('username')
    password = data.get('password')
    
    user = authenticate(username=username, password=password)   
    if not user:
        return JsonResponse({'error':'Invalid credentials'}, status=401)
    token = generate_token(user)
    return JsonResponse({'token': token, 'username': user.username,'is_staff': user.is_staff})

@csrf_exempt
def admin_register(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
    
    data = get_request_data(request)
    secret = data.get('secret_key')
    MASTER_KEY = os.environ.get('MASTER_KEY', 'CREATE_ADMIN_123')
    
    if secret != MASTER_KEY:
        return JsonResponse({'error':'Unauthorized - Wrong secret_key'}, status=403)
        
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return JsonResponse({'error':'username & password required'}, status=400)
        
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error':'exists'}, status=400)
    
    admin = User.objects.create_user(username=username, password=password, is_staff=True)
    token = generate_token(admin)
    return JsonResponse({'message':'admin created','token': token}, status=201)

@csrf_exempt
def admin_login(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
        
    data = get_request_data(request)
    username = data.get('username')
    password = data.get('password')
    
    user = authenticate(username=username, password=password)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Invalid admin credentials'}, status=401)
    token = generate_token(user)
    return JsonResponse({'token': token, 'username': user.username,'is_staff': user.is_staff})

# ----------------------------
# CATEGORY endpoints
# ----------------------------
@csrf_exempt
def categories(request):
    if request.method == 'GET':
        qs = Category.objects.all()
        ser = CategorySerializer(qs, many=True)
        return JsonResponse(ser.data, safe=False)

    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)

    data = get_request_data(request)
    name = data.get('name')
    if not name:
        return JsonResponse({'error': 'Name is required'}, status=400)
        
    slug = data.get('slug') or slugify(name)
    desc = data.get('description','')
    cat = Category.objects.create(name=name, slug=slug, description=desc)
    return JsonResponse(CategorySerializer(cat).data, status=201)

@csrf_exempt
def category_detail(request, pk):
    cat = get_object_or_404(Category, pk=pk)
    if request.method == 'GET':
        return JsonResponse(CategorySerializer(cat).data)
        
    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)
        
    if request.method == 'PUT':
        data = get_request_data(request)
        cat.name = data.get('name', cat.name)
        cat.slug = data.get('slug', cat.slug)
        cat.description = data.get('description', cat.description)
        cat.save()
        return JsonResponse(CategorySerializer(cat).data)
        
    if request.method == 'DELETE':
        cat.delete()
        return JsonResponse({'message':'deleted'})

# ----------------------------
# PRODUCT endpoints
# ----------------------------
@csrf_exempt
def products_list_create(request):
    # --- GET Logic (Public) ---
    if request.method == 'GET':
        qs = Product.objects.filter(is_active=True)
        q = request.GET.get('q')
        cat = request.GET.get('category')
        try:
            if request.GET.get('min_price'): qs = qs.filter(price__gte=float(request.GET.get('min_price')))
            if request.GET.get('max_price'): qs = qs.filter(price__lte=float(request.GET.get('max_price')))
        except ValueError: pass 
        ser = ProductSerializer(qs, many=True)
        return JsonResponse(ser.data, safe=False)

    # --- POST Logic (Admin) ---
    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)

    # Wrap everything in try/except to catch 500 errors
    try:
        data = get_request_data(request)
        
        # 1. Validation
        title = data.get('title')
        if not title: return JsonResponse({'error': 'Title required'}, status=400)
        
        # 2. Extract Data safely
        description = data.get('description','')
        brand = data.get('brand','')
        slug = data.get('slug') or slugify(title)
        price = float(data.get('price', 0))
        stock = int(data.get('stock', 0))

        # 3. Category Logic
        category = None
        cat_name = data.get('category_name')
        
        if cat_name:
            clean_name = str(cat_name).strip()
            if clean_name:
                category, created = Category.objects.get_or_create(
                    name=clean_name,
                    defaults={'slug': slugify(clean_name), 'description': ''}
                )

        # 4. Create Product (With created_by)
        p = Product.objects.create(
            title=title, slug=slug, description=description,
            price=price, brand=brand, stock=stock, category=category,
            created_by=user  # <--- This requires the migration!
        )

        # 5. Image Upload
        files = request.FILES.getlist('images')
        for f in files:
            try:
                r = cloud_upload(f)
                ProductImage.objects.create(product=p, image_url=r.get('secure_url'))
            except Exception as img_e:
                print(f"Image Upload Failed: {img_e}")

        # Text Image URLs
        img_urls = data.get('image_urls')
        if img_urls:
            for url in img_urls.split(','):
                if url.strip(): 
                    ProductImage.objects.create(product=p, image_url=url.strip())

        return JsonResponse(ProductSerializer(p).data, status=201)

    except Exception as e:
        # 👇 THIS PRINTS THE REAL ERROR TO YOUR TERMINAL
        print(f"SERVER ERROR ===> {str(e)}")
        # Returns the specific error to Frontend instead of generic 500
        return JsonResponse({'error': f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
def product_detail(request, pk):
    p = get_object_or_404(Product, pk=pk)
    if request.method == 'GET':
        return JsonResponse(ProductSerializer(p).data)
        
    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)
    
    # Only allow the ADMIN to edit/delete
    if p.created_by and p.created_by != user and not user.is_superuser:
        return JsonResponse({'error': 'You can only edit products you created'}, status=403)
        
    if request.method == 'PUT':
        data = get_request_data(request)
        p.title = data.get('title', p.title)
        p.slug = data.get('slug', p.slug)
        p.description = data.get('description', p.description)
        p.brand = data.get('brand', p.brand)
        
        try:
            if 'price' in data: p.price = float(data['price'])
            if 'stock' in data: p.stock = int(data['stock'])
        except ValueError:
             return JsonResponse({'error': 'Invalid number format'}, status=400)

        # Handle string "true"/"false" from FormData
        is_active_val = str(data.get('is_active', p.is_active)).lower()
        p.is_active = is_active_val == 'true'
        
        cat_id = data.get('category_id')
        if cat_id:
            p.category = get_object_or_404(Category, pk=cat_id)
        p.save()

        files = request.FILES.getlist('images')
        if files:
            if data.get('clear_images') == 'true':
                p.images.all().delete()
            for f in files:
                r = cloud_upload(f)
                ProductImage.objects.create(product=p, image_url=r.get('secure_url'))

        return JsonResponse(ProductSerializer(p).data)

    if request.method == 'DELETE':
        p.delete()
        return JsonResponse({'message':'deleted'})
    
# For Admin's Product Details
@csrf_exempt
def get_my_products(request):
    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)
    
    # Filter products where created_by == current_user
    qs = Product.objects.filter(created_by=user).order_by('-created_at')
    ser = ProductSerializer(qs, many=True)
    return JsonResponse(ser.data, safe=False)
    
@csrf_exempt
def product_image_detail(request, pk):
    img = get_object_or_404(ProductImage, pk=pk)
    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)
    
    if request.method == 'DELETE':
        img.delete()
        return JsonResponse({'message':'deleted'})
    
    if request.method == 'PUT':
        data = get_request_data(request)
        img.is_featured = str(data.get('is_featured')).lower() == 'true'
        img.alt_text = data.get('alt_text', img.alt_text)
        img.save()
        return JsonResponse(ProductImageSerializer(img).data)

# ----------------------------
# CART
# ----------------------------
@csrf_exempt
def cart_view(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)

    cart, created = Cart.objects.get_or_create(user=user)

    if request.method == "GET":
        # 1. Fetch Product and Images efficiently
        cart_items = cart.items.select_related('product').prefetch_related('product__images').all()
        
        items = []
        for item in cart_items:
            # 2. Get the first image safely
            first_img = item.product.images.first()
            img_url = first_img.image_url if first_img else None
            
            # 3. Construct the full data object
            items.append({
                "id": item.id,
                "product_id": item.product.id,
                "title": item.product.title,   
                "price": float(item.product.price),
                "image": img_url,        
                "quantity": item.quantity
            })
            
        return JsonResponse({"cart_id": cart.id, "items": items})

    elif request.method == "POST":
        data = get_request_data(request)
        product_id = data.get("product_id")
        try:
            quantity = int(data.get("quantity", 1))
        except ValueError:
            return JsonResponse({"error":"Invalid quantity"}, status=400)

        product = get_object_or_404(Product, pk=product_id)
        ci, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity":quantity})
        
        if not created:
            ci.quantity += quantity
            ci.save()
        return JsonResponse({"id": ci.id, "product": ci.product.id, "quantity": ci.quantity})

    elif request.method == "DELETE":
        data = get_request_data(request)
        item_id = data.get("item_id")
        if item_id:
            ci = get_object_or_404(CartItem, pk=item_id, cart=cart)
            ci.delete()
            return JsonResponse({"message":"item removed"})
        else:
            cart.items.all().delete()
            return JsonResponse({"message":"cart cleared"})

@csrf_exempt
def cart_item_detail(request, pk):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
    cart = getattr(user, 'cart', None)
    if not cart:
        return JsonResponse({"error":"Cart not found"}, status=404)
    item = get_object_or_404(CartItem, pk=pk, cart=cart)
    
    if request.method == "GET":
        return JsonResponse({"id": item.id, "product": item.product.id, "quantity": item.quantity})
    elif request.method == "PUT":
        data = get_request_data(request)
        try:
            item.quantity = int(data.get("quantity", item.quantity))
        except ValueError:
            return JsonResponse({"error":"Invalid quantity"}, status=400)
        item.save()
        return JsonResponse({"id": item.id, "product": item.product.id, "quantity": item.quantity})
    elif request.method == "DELETE":
        item.delete()
        return JsonResponse({"message": "Item removed"})
    
# ----------------------------
# WISHLIST ENDPOINTS
# ----------------------------

@csrf_exempt
def wishlist_view(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    # Get or create the user's wishlist
    wishlist, created = Wishlist.objects.get_or_create(user=user)

    if request.method == "GET":
        # Return all items in the wishlist
        items = wishlist.items.select_related('product').all()
        # Note: We need to serialize this manually or use DRF serializer
        # Using the Serializer we created in step 2:
        serializer = WishlistItemSerializer(items, many=True)
        return JsonResponse(serializer.data, safe=False)

@csrf_exempt
def add_to_wishlist(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "POST":
        data = get_request_data(request)
        product_id = data.get("product_id")
        
        if not product_id:
            return JsonResponse({"error": "Product ID required"}, status=400)

        wishlist, _ = Wishlist.objects.get_or_create(user=user)
        product = get_object_or_404(Product, pk=product_id)

        # Create item if it doesn't exist already
        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        
        if created:
            return JsonResponse({"message": "Added to wishlist"})
        else:
            return JsonResponse({"message": "Item already in wishlist"}, status=200)

@csrf_exempt
def remove_from_wishlist(request, product_id):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    if request.method == "DELETE":
        wishlist = get_object_or_404(Wishlist, user=user)
        # Find the item by Product ID inside this user's wishlist
        item = get_object_or_404(WishlistItem, wishlist=wishlist, product_id=product_id)
        item.delete()
        return JsonResponse({"message": "Item removed"})

# ----------------------------
# ADDRESS
# ----------------------------
@csrf_exempt
def addresses(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
        
    if request.method == "GET":
        qs = Address.objects.filter(user=user)
        data = [{"id":a.id, "line1": a.line1, "city": a.city, "state": a.state} for a in qs]
        return JsonResponse(data, safe=False)
        
    elif request.method == "POST":
        data = get_request_data(request)
        addr = Address.objects.create(
            user=user,
            full_name=data.get("full_name", user.username),
            address_line1=data.get("line1", ""),
            address_line2=data.get("line2", ""),
            city=data.get("city",""),
            state=data.get("state",""),
            postal_code=data.get("zip_code", ""),
            country=data.get("country",""),
        )
        return JsonResponse({ "id": addr.id, "line1": addr.address_line1,  "city": addr.city }, status=201)

@csrf_exempt
def address_detail(request, pk):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
    addr = get_object_or_404(Address, pk=pk, user=user)
    
    if request.method == "GET":
        return JsonResponse(AddressSerializer(addr).data)
        
    elif request.method == "PUT":
        data = get_request_data(request)
        addr.line1 = data.get("line1", addr.line1)
        addr.line2 = data.get("line2", addr.line2)
        addr.city = data.get("city", addr.city)
        addr.state = data.get("state", addr.state)
        addr.zip_code = data.get("zip_code", addr.zip_code)
        addr.country = data.get("country", addr.country)
        addr.save()
        return JsonResponse(AddressSerializer(addr).data)
        
    elif request.method == "DELETE":
        addr.delete()
        return JsonResponse({"message": "Address deleted"})

# ----------------------------
# ORDERS
# ----------------------------
@csrf_exempt
def create_order(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
        
    cart = getattr(user, 'cart', None)
    if not cart or not cart.items.exists():
        return JsonResponse({"error":"Cart is empty"}, status=400)
    
    data = get_request_data(request)
    address_id = data.get("address_id")
    
    # 1. Get the Transaction ID sent from Frontend (Dummy or Real)
    txn_id = data.get("transaction_id") 
    
    if not address_id:
        return JsonResponse({"error": "Address ID required"}, status=400)
    
    address = get_object_or_404(Address, pk=address_id, user=user)
    cart_items = cart.items.select_related('product').all()
    
    total = sum([item.product.price * item.quantity for item in cart_items])
    
    try:
        with transaction.atomic():
            # 2. Create Order with your specific model fields
            order = Order.objects.create(
                user=user, 
                address=address, 
                total_amount=total,
                status='paid', # <--- Change status from 'pending' to 'paid'
                payment_id=txn_id # <--- Map transaction_id to your 'payment_id' field
            )
            
            order_items_objs = [
                OrderItem(
                    order=order, 
                    product=item.product, 
                    quantity=item.quantity, 
                    unit_price=item.product.price
                ) for item in cart_items
            ]
            OrderItem.objects.bulk_create(order_items_objs)
            
            cart.items.all().delete()
            
        return JsonResponse({
            "order_id": order.id, 
            "total_amount": total, 
            "status": "paid",
            "payment_id": txn_id
        }, status=201)
        
    except Exception as e:
        return JsonResponse({"error": "Failed to create order", "details": str(e)}, status=500)

@csrf_exempt
def orders_list(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    qs = Order.objects.filter(user=user).prefetch_related('items__product').order_by('-created_at')
    
    data = []
    for order in qs:
        items = [{"product": oi.product.id, "quantity": oi.quantity, "unit_price": oi.unit_price} for oi in order.items.all()]
        data.append({
            "id": order.id,
            "total_amount": order.total_amount,
            "status": order.status,
            "address": order.address.id,
            "items": items,
            "created_at": order.created_at
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def order_detail(request, pk):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    order = get_object_or_404(Order, pk=pk, user=user)

    if request.method == "GET":
        items = [
            {
                "product": oi.product.id,
                "quantity": oi.quantity,
                "unit_price": oi.unit_price
            }
            for oi in order.items.all()
        ]
        data = {
            "id": order.id,
            "total_amount": order.total_amount,
            "status": order.status,
            "address": order.address.id,
            "items": items,
            "created_at": order.created_at
        }
        return JsonResponse(data)

    if request.method == "DELETE":
        order.delete()
        return JsonResponse({"message": "order deleted"})

# ----------------------------
# PAYMENTS
# ----------------------------
@csrf_exempt
def initiate_payu_payment(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    if request.method == "POST":
        # 1. Get Data & Validate Address
        data = get_request_data(request)
        address_id = data.get('address_id')
        
        if not address_id:
            return JsonResponse({"error": "Address ID is required"}, status=400)

        # 2. Calculate Amount
        cart = getattr(user, 'cart', None)
        if not cart or not cart.items.exists():
            return JsonResponse({"error": "Cart is empty"}, status=400)
            
        cart_items = cart.items.all()
        total_amount = sum([item.product.price * item.quantity for item in cart_items])
        
        # IMPORTANT: Format amount to 2 decimal places string for Hash consistency
        amount_str = f"{total_amount:.2f}"
        
        # 3. Prepare Data
        txnid = f"Txn{uuid.uuid4().hex[:10]}"
        productinfo = "MyShop Purchase"
        firstname = user.username
        email = user.email or "test@example.com"
        
        # 4. Set UDFs (User Defined Fields)
        udf1 = str(user.id)      # Store User ID
        udf2 = str(address_id)   # Store Address ID
        
        # 5. Generate Hash (Crucial Step!)
        # Sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|||||||||salt
        # Note: We use udf1 and udf2. There are usually 11 pipes after email in generic format.
        # Since we fill 2 slots, we leave 9 empty pipes before salt.
        
        hash_string = f"{settings.PAYU_MERCHANT_KEY}|{txnid}|{amount_str}|{productinfo}|{firstname}|{email}|{udf1}|{udf2}|||||||||{settings.PAYU_MERCHANT_SALT}"
        
        hash_value = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

        # 6. Return params to Frontend
        return JsonResponse({
            "key": settings.PAYU_MERCHANT_KEY,
            "txnid": txnid,
            "amount": amount_str,
            "productinfo": productinfo,
            "firstname": firstname,
            "email": email,
            "udf1": udf1, # User ID sent to PayU
            "udf2": udf2, # Address ID sent to PayU
            "phone": "9999999999",
            "surl": "http://127.0.0.1:8000/api/payu/success/", # Backend Success URL
            "furl": "http://127.0.0.1:8000/api/payu/failure/", # Backend Failure URL
            "hash": hash_value,
            "action": settings.PAYU_BASE_URL,
        })

@csrf_exempt
def payu_success(request):
    if request.method == "POST":
        data = request.POST
        
        # 1. Retrieve Data sent back by PayU
        user_id = data.get('udf1')
        address_id = data.get('udf2')
        txn_id = data.get('txnid')
        
        # 2. Get User Safely
        try:
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, TypeError):
            # If user data is lost, redirect to home
            return redirect("http://localhost:5173/") 

        # 3. 👇 CRITICAL FIX: Use 'filter().first()' instead of 'get_object_or_404'
        # This prevents the 404 Crash if the address was deleted during testing.
        address = Address.objects.filter(pk=address_id).first()
        
        # Fallback: If the specific address is gone, grab the user's first available address
        if not address:
            address = Address.objects.filter(user=user).first()
            
        # 4. Process Order
        cart = getattr(user, 'cart', None)
        
        # If cart is empty (already processed) or missing, just redirect to orders
        if not cart or not cart.items.exists():
            return redirect("http://localhost:5173/Success")

        try:
            with transaction.atomic():
                # Calculate Total
                total = sum([item.product.price * item.quantity for item in cart.items.all()])
                
                # Create Order (Allow address to be None if absolutely necessary)
                order = Order.objects.create(
                    user=user, 
                    address=address, 
                    total_amount=total,
                    status="Paid",
                    payment_id=txn_id
                )
                
                # Move Cart Items -> Order Items
                items = [
                    OrderItem(
                        order=order, 
                        product=item.product, 
                        quantity=item.quantity, 
                        unit_price=item.product.price
                    ) for item in cart.items.all()
                ]
                OrderItem.objects.bulk_create(items)
                
                # Clear Cart
                cart.items.all().delete()

            # 5. ✅ Redirect to React Frontend Success Page
            return redirect("http://localhost:5173/Success")
            
        except Exception as e:
            print(f"Order Creation Error: {e}")
            # Redirect to cart if something goes wrong
            return redirect("http://localhost:5173/cart")
            
    # If not POST, go home
    return redirect("http://localhost:5173/")

@csrf_exempt
def payu_failure(request):
    # Redirect back to frontend cart on failure
    return redirect("http://localhost:5173/cart")

# ----------------------------
# REVIEWS
# ----------------------------
@csrf_exempt
def add_review(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
    
    data = get_request_data(request)
    product_id = data.get("product_id")
    try:
        rating = int(data.get("rating", 5))
    except ValueError:
        rating = 5

    body = data.get("body", "")
    title = data.get("title", "")
    product = get_object_or_404(Product, pk=product_id)
    
    rev, created = Review.objects.get_or_create(
        product=product, user=user, 
        defaults={"rating":rating, "body":body, "title":title}
    )
    
    if not created:
        rev.rating = rating
        rev.body = body
        rev.title = title
        rev.save()
        
    return JsonResponse({"id": rev.id, "product": product.id, "rating": rev.rating, "body": rev.body})

@csrf_exempt
def review_detail(request, pk):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
    
    review = get_object_or_404(Review, pk=pk, user=user)
    
    if request.method == "GET":
        return JsonResponse({"id": review.id, "product": review.product.id, "rating": review.rating, "title": review.title, "body": review.body})
        
    elif request.method == "PUT":
        data = get_request_data(request)
        try:
            if 'rating' in data:
                review.rating = int(data.get("rating"))
        except ValueError:
            pass
            
        review.title = data.get("title", review.title)
        review.body = data.get("body", review.body)
        review.save()
        return JsonResponse({"id": review.id, "product": review.product.id, "rating": review.rating, "title": review.title, "body": review.body})
        
    elif request.method == "DELETE":
        review.delete()
        return JsonResponse({"message": "Review deleted"})

@csrf_exempt
def product_reviews(request, product_id):
    product = get_object_or_404(Product, pk=product_id)
    if request.method == "GET":
        reviews = Review.objects.filter(product=product).select_related('user')
        data = [
            {
                "id": r.id,
                "user": r.user.username,
                "rating": r.rating,
                "title": r.title,
                "body": r.body,
                "created_at": r.created_at
            }
            for r in reviews
        ]
        return JsonResponse(data, safe=False)
    
    
