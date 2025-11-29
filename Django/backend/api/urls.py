from django.urls import path
from . import views

urlpatterns = [
    # ----------------------------
    # AUTH
    # ----------------------------
    path('auth/register/', views.user_register, name='user_register'),
    path('auth/login/', views.user_login, name='user_login'),
    path('auth/admin/register/', views.admin_register, name='admin_register'),
    path('auth/admin/login/', views.admin_login, name='admin_login'),

    # ----------------------------
    # CATEGORY
    # ----------------------------
    path('categories/', views.categories, name='categories_list_create'),
    path('categories/<int:pk>/', views.category_detail, name='category_detail'),

    # ----------------------------
    # PRODUCT
    # ----------------------------
    path('products/', views.products_list_create, name='products_list_create'),
    path('products/<int:pk>/', views.product_detail, name='product_detail'),

    # ----------------------------
    # PRODUCT IMAGES
    # ----------------------------
    path('product-images/<int:pk>/', views.product_image_detail, name='product_image_detail'),

    # ----------------------------
    # CART
    # ----------------------------
    path('cart/', views.cart_view, name='cart_view'),

    # ----------------------------
    # ADDRESSES
    # ----------------------------
    path('addresses/', views.addresses, name='addresses_list_create'),
    path('addresses/<int:pk>/', views.address_detail, name='address_detail'),

    # ----------------------------
    # ORDERS
    # ----------------------------
    path('orders/', views.orders_list, name='orders_list'),
    path('orders/create/', views.create_order, name='create_order'),
    path('orders/<int:pk>/', views.order_detail, name='order_detail'),
    

    # ----------------------------
    # REVIEWS
    # ----------------------------
    path('reviews/add/', views.add_review, name='add_review'),
    path('reviews/product/<int:product_id>/', views.product_reviews, name='product_reviews'),
]
