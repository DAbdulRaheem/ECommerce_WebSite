from django.urls import path
from . import views

urlpatterns = [
    # --- Authentication ---
    path('auth/register/', views.user_register, name='user_register'),
    path('auth/login/', views.user_login, name='user_login'),
    path('auth/admin/register/', views.admin_register, name='admin_register'),
    path('auth/admin/login/', views.admin_login, name='admin_login'),

    # --- Categories ---
    path('categories/', views.categories, name='category_list_create'),
    path('categories/<int:pk>/', views.category_detail, name='category_detail'),

    # --- Products ---
    path('products/', views.products_list_create, name='products_list_create'),
    path('products/<int:pk>/', views.product_detail, name='product_detail'),
    path('products/images/<int:pk>/', views.product_image_detail, name='product_image_detail'),
    path('products/my/', views.get_my_products, name='my_products'), # Admin's Products
    
    # --- Cart ---
    path('cart/', views.cart_view, name='cart_view'), # GET (view), POST (add), DELETE (clear)
    path('cart/items/<int:pk>/', views.cart_item_detail, name='cart_item_detail'), # PUT (update qty), DELETE (remove item)
    
    # --- Wishlist ---
    path('wishlist/', views.wishlist_view, name='wishlist_view'), # GET
    path('wishlist/add/', views.add_to_wishlist, name='wishlist_add'), # POST
    path('wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='wishlist_remove'), # DELETE

    # --- Addresses ---
    path('addresses/', views.addresses, name='address_list_create'),
    path('addresses/<int:pk>/', views.address_detail, name='address_detail'),

    # --- Orders ---
    path('orders/create/', views.create_order, name='create_order'), # Checkout endpoint
    path('orders/', views.orders_list, name='orders_list'), # Order history
    path('orders/<int:pk>/', views.order_detail, name='order_detail'),
    
    # --- Payment ---
    path('stripe/create-intent/', views.create_stripe_payment_intent, name='stripe_intent'),

    # --- Reviews ---
    path('reviews/add/', views.add_review, name='add_review'),
    path('reviews/<int:pk>/', views.review_detail, name='review_detail'),
    path('products/<int:product_id>/reviews/', views.product_reviews, name='product_reviews_list'),
]