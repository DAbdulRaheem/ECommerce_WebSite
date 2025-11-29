from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from cloudinary.uploader import upload as cloud_upload
import jwt, datetime, os

from .models import (Category, Product, ProductImage, UserProfile, Address,
                     Cart, CartItem, Order, OrderItem, Review)
from .serializers import (CategorySerializer, ProductSerializer, ProductImageSerializer,
                          AddressSerializer, CartSerializer, CartItemSerializer,
                          OrderSerializer, ReviewSerializer)

# ----------------------------
# JWT helpers
# ----------------------------
JWT_SECRET = getattr(settings, 'SECRET_KEY')
JWT_ALGO = 'HS256'
JWT_EXP_HOURS = 24

def generate_token(user):
    payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXP_HOURS),
        'iat': datetime.datetime.utcnow(),
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
    username = request.POST.get('username')
    email = request.POST.get('email')
    password = request.POST.get('password')
    if not username or not email or not password:
        return JsonResponse({'error':'All fields required'}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error':'Username exists'}, status=400)
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user)
    token = generate_token(user)
    return JsonResponse({'message':'User created','token': token, 'username': user.username})

@csrf_exempt
def user_login(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
    username = request.POST.get('username')
    password = request.POST.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return JsonResponse({'error':'Invalid credentials'}, status=401)
    token = generate_token(user)
    return JsonResponse({'token': token, 'username': user.username})

@csrf_exempt
def admin_register(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
    secret = request.POST.get('secret_key') or os.environ.get('MASTER_KEY')
    MASTER_KEY = os.environ.get('MASTER_KEY','CREATE_ADMIN_123')
    if secret != MASTER_KEY:
        return JsonResponse({'error':'Unauthorized'}, status=403)
    username = request.POST.get('username')
    password = request.POST.get('password')
    if not username or not password:
        return JsonResponse({'error':'username & password required'}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error':'exists'}, status=400)
    admin = User.objects.create_user(username=username, password=password, is_staff=True)
    token = generate_token(admin)
    return JsonResponse({'message':'admin created','token': token})

@csrf_exempt
def admin_login(request):
    if request.method != "POST":
        return JsonResponse({'error':'Invalid method'}, status=405)
    username = request.POST.get('username')
    password = request.POST.get('password')
    user = authenticate(username=username, password=password)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Invalid admin credentials'}, status=401)
    token = generate_token(user)
    return JsonResponse({'token': token, 'username': user.username})

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

    name = request.POST.get('name')
    slug = request.POST.get('slug') or slugify(name)
    desc = request.POST.get('description','')
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
        cat.name = request.POST.get('name', cat.name)
        cat.slug = request.POST.get('slug', cat.slug)
        cat.description = request.POST.get('description', cat.description)
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
    if request.method == 'GET':
        qs = Product.objects.filter(is_active=True)
        q = request.GET.get('q')
        cat = request.GET.get('category')
        minp = request.GET.get('min_price')
        maxp = request.GET.get('max_price')
        if q:
            qs = qs.filter(title__icontains=q) | qs.filter(description__icontains=q)
        if cat:
            qs = qs.filter(category__id=cat)
        if minp:
            qs = qs.filter(price__gte=minp)
        if maxp:
            qs = qs.filter(price__lte=maxp)
        ser = ProductSerializer(qs, many=True)
        return JsonResponse(ser.data, safe=False)

    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)

    title = request.POST.get('title')
    description = request.POST.get('description','')
    price = request.POST.get('price') or 0
    brand = request.POST.get('brand','')
    stock = request.POST.get('stock') or 0
    cat_id = request.POST.get('category_id', None)
    slug = request.POST.get('slug') or slugify(title)

    category = None
    if cat_id:
        category = get_object_or_404(Category, pk=cat_id)

    p = Product.objects.create(
        title=title, slug=slug, description=description,
        price=price, brand=brand, stock=stock, category=category
    )

    files = request.FILES.getlist('images')
    for f in files:
        r = cloud_upload(f)
        ProductImage.objects.create(product=p, image_url=r.get('secure_url'))

    img_urls = request.POST.get('image_urls')
    if img_urls:
        for url in img_urls.split(','):
            url = url.strip()
            if url:
                ProductImage.objects.create(product=p, image_url=url)

    return JsonResponse(ProductSerializer(p).data, status=201)

@csrf_exempt
def product_detail(request, pk):
    p = get_object_or_404(Product, pk=pk)
    if request.method == 'GET':
        return JsonResponse(ProductSerializer(p).data)
    user = decode_token_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'error':'Admin only'}, status=403)
    if request.method == 'PUT':
        p.title = request.POST.get('title', p.title)
        p.slug = request.POST.get('slug', p.slug)
        p.description = request.POST.get('description', p.description)
        p.price = request.POST.get('price', p.price)
        p.brand = request.POST.get('brand', p.brand)
        p.stock = request.POST.get('stock', p.stock)
        p.is_active = request.POST.get('is_active', p.is_active)
        cat_id = request.POST.get('category_id')
        if cat_id:
            p.category = get_object_or_404(Category, pk=cat_id)
        p.save()

        files = request.FILES.getlist('images')
        if files:
            if request.POST.get('clear_images') == 'true':
                p.images.all().delete()
            for f in files:
                r = cloud_upload(f)
                ProductImage.objects.create(product=p, image_url=r.get('secure_url'))

        return JsonResponse(ProductSerializer(p).data)

    if request.method == 'DELETE':
        p.delete()
        return JsonResponse({'message':'deleted'})
    
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
        img.is_featured = bool(request.POST.get('is_featured', img.is_featured))
        img.alt_text = request.POST.get('alt_text', img.alt_text)
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
        items = [{"id":item.id, "product": item.product.id, "quantity": item.quantity} for item in cart.items.all()]
        return JsonResponse({"cart_id": cart.id, "items": items})

    elif request.method == "POST":
        product_id = request.POST.get("product_id")
        quantity = int(request.POST.get("quantity", 1))
        product = get_object_or_404(Product, pk=product_id)
        ci, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity":quantity})
        if not created:
            ci.quantity += quantity
            ci.save()
        return JsonResponse({"id": ci.id, "product": ci.product.id, "quantity": ci.quantity})

    elif request.method == "DELETE":
        item_id = request.POST.get("item_id")
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
        item.quantity = int(request.POST.get("quantity", item.quantity))
        item.save()
        return JsonResponse({"id": item.id, "product": item.product.id, "quantity": item.quantity})
    elif request.method == "DELETE":
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
        addr = Address.objects.create(
            user=user,
            line1=request.POST.get("line1",""),
            line2=request.POST.get("line2",""),
            city=request.POST.get("city",""),
            state=request.POST.get("state",""),
            zip_code=request.POST.get("zip_code",""),
            country=request.POST.get("country",""),
        )
        return JsonResponse({"id": addr.id, "line1": addr.line1, "city": addr.city})

@csrf_exempt
def address_detail(request, pk):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
    addr = get_object_or_404(Address, pk=pk, user=user)
    if request.method == "GET":
        return JsonResponse({
            "id": addr.id,
            "line1": addr.line1,
            "line2": addr.line2,
            "city": addr.city,
            "state": addr.state,
            "zip_code": addr.zip_code,
            "country": addr.country
        })
    elif request.method == "PUT":
        addr.line1 = request.POST.get("line1", addr.line1)
        addr.line2 = request.POST.get("line2", addr.line2)
        addr.city = request.POST.get("city", addr.city)
        addr.state = request.POST.get("state", addr.state)
        addr.zip_code = request.POST.get("zip_code", addr.zip_code)
        addr.country = request.POST.get("country", addr.country)
        addr.save()
        return JsonResponse({
            "id": addr.id,
            "line1": addr.line1,
            "line2": addr.line2,
            "city": addr.city,
            "state": addr.state,
            "zip_code": addr.zip_code,
            "country": addr.country
        })
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
    address_id = request.POST.get("address_id")
    address = get_object_or_404(Address, pk=address_id, user=user)
    total = sum([item.product.price * item.quantity for item in cart.items.all()])
    order = Order.objects.create(user=user, address=address, total_amount=total)
    for item in cart.items.all():
        OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity, unit_price=item.product.price)
    cart.items.all().delete()
    return JsonResponse({"order_id": order.id, "total_amount": total})

@csrf_exempt
def orders_list(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    qs = Order.objects.filter(user=user).order_by('-created_at')
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
# REVIEWS
# ----------------------------
@csrf_exempt
def add_review(request):
    user = decode_token_from_request(request)
    if not user:
        return JsonResponse({"error":"Authentication required"}, status=401)
    product_id = request.POST.get("product_id")
    rating = int(request.POST.get("rating", 5))
    body = request.POST.get("body", "")
    title = request.POST.get("title", "")
    product = get_object_or_404(Product, pk=product_id)
    rev, created = Review.objects.get_or_create(product=product, user=user, defaults={"rating":rating, "body":body, "title":title})
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
        review.rating = int(request.POST.get("rating", review.rating))
        review.title = request.POST.get("title", review.title)
        review.body = request.POST.get("body", review.body)
        review.save()
        return JsonResponse({"id": review.id, "product": review.product.id, "rating": review.rating, "title": review.title, "body": review.body})
    elif request.method == "DELETE":
        review.delete()
        return JsonResponse({"message": "Review deleted"})

@csrf_exempt
def product_reviews(request, product_id):
    product = get_object_or_404(Product, pk=product_id)

    if request.method == "GET":
        reviews = Review.objects.filter(product=product)
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

