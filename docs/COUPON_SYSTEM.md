# Coupon & Discount System

This document outlines the comprehensive coupon and discount management system implemented in the e-commerce API.

## 🎯 Overview

The coupon system provides enterprise-level discount management with support for multiple coupon types, complex conditions, usage tracking, and comprehensive analytics. It includes both manual coupons and automatic discounts with advanced targeting capabilities.

## 🎫 Core Features

### 1. Coupon Types
- **Percentage Discounts** - X% off order total
- **Fixed Amount Discounts** - $X off order total  
- **Free Shipping** - Waive shipping costs
- **Buy X Get Y** - Complex promotional offers

### 2. Advanced Conditions
- **Product-specific** - Apply to specific products
- **Category-based** - Apply to product categories
- **Minimum quantity** - Require minimum items
- **Minimum order amount** - Require minimum spend
- **User group targeting** - Target specific user segments

### 3. Usage Controls
- **Total usage limits** - Global redemption caps
- **Per-user limits** - Individual usage restrictions
- **Time-based validity** - Start/end date controls
- **First-time customer only** - New customer targeting
- **Stackable options** - Combine with other offers

### 4. Management Features
- **Public vs Private** - Control coupon visibility
- **User assignment** - Target specific customers
- **Usage tracking** - Comprehensive analytics
- **Automatic discounts** - Cart-level rules
- **Admin controls** - Full management interface

## 🗄️ Database Schema

### Core Tables

#### `coupons`
```sql
- id (serial, primary key)
- code (varchar, unique) - Coupon code (e.g., "SAVE20")
- name (varchar) - Display name
- description (text) - Optional description
- type (varchar) - percentage, fixed_amount, free_shipping, buy_x_get_y
- value (decimal) - Discount value
- minimum_order_amount (decimal, optional)
- maximum_discount_amount (decimal, optional)
- usage_limit (integer, optional) - Total usage limit
- usage_count (integer) - Current usage count
- user_usage_limit (integer) - Per-user limit
- is_active (boolean)
- is_public (boolean) - Public visibility
- stackable (boolean) - Can combine with others
- first_time_customer_only (boolean)
- valid_from, valid_until (timestamps)
- created_by (uuid) - Admin who created it
- created_at, updated_at (timestamps)
```

#### `coupon_usages`
```sql
- id (serial, primary key)
- coupon_id (integer, foreign key)
- user_id (uuid, foreign key, optional)
- order_id (integer, foreign key, optional)
- discount_amount (decimal) - Actual discount applied
- original_amount (decimal) - Order total before discount
- used_at (timestamp)
```

#### `coupon_conditions`
```sql
- id (serial, primary key)
- coupon_id (integer, foreign key)
- condition_type (varchar) - product, category, user_group, minimum_quantity
- condition_value (text) - JSON configuration
- is_inclusive (boolean) - Include vs exclude
- created_at (timestamp)
```

#### `buy_x_get_y_promotions`
```sql
- id (serial, primary key)
- coupon_id (integer, foreign key)
- buy_quantity (integer) - Items to buy
- get_quantity (integer) - Items to get free/discounted
- buy_product_ids (integer[]) - Qualifying products
- get_product_ids (integer[]) - Free/discounted products
- buy_category_ids (integer[]) - Qualifying categories
- get_category_ids (integer[]) - Free/discounted categories
- get_discount_type (varchar) - free, percentage, fixed_amount
- get_discount_value (decimal)
- created_at (timestamp)
```

#### `user_coupons`
```sql
- id (serial, primary key)
- coupon_id (integer, foreign key)
- user_id (uuid, foreign key)
- assigned_by (uuid, foreign key) - Admin who assigned
- assigned_at (timestamp)
- used_at (timestamp, optional)
- is_used (boolean)
```

#### `automatic_discounts`
```sql
- id (serial, primary key)
- name (varchar) - Display name
- description (text)
- type (varchar) - percentage, fixed_amount, free_shipping
- value (decimal)
- minimum_order_amount (decimal, optional)
- maximum_discount_amount (decimal, optional)
- priority (integer) - Application order
- is_active (boolean)
- stackable (boolean)
- valid_from, valid_until (timestamps)
- created_by (uuid)
- created_at, updated_at (timestamps)
```

## 🚀 API Endpoints

### Coupon Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons` | Create new coupon |
| GET | `/api/coupons` | Get coupons with filters |
| GET | `/api/coupons/{id}` | Get coupon by ID |
| PUT | `/api/coupons/{id}` | Update coupon |
| DELETE | `/api/coupons/{id}` | Delete/deactivate coupon |
| POST | `/api/coupons/assign` | Assign coupon to users |
| GET | `/api/coupons/statistics` | Get usage statistics |

### Customer-Facing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coupons/public` | Get public coupons |
| GET | `/api/coupons/my-coupons` | Get user's available coupons |
| POST | `/api/coupons/validate` | Validate coupon for cart |
| POST | `/api/coupons/apply` | Apply coupon to cart |
| POST | `/api/coupons/remove` | Remove coupon from cart |

## 📝 Usage Examples

### Creating a Percentage Coupon
```javascript
const couponData = {
  code: "SAVE20",
  name: "20% Off Everything",
  description: "Get 20% off your entire order",
  type: "percentage",
  value: 20,
  minimumOrderAmount: 50,
  maximumDiscountAmount: 100,
  usageLimit: 1000,
  userUsageLimit: 1,
  isActive: true,
  isPublic: true,
  stackable: false,
  validFrom: "2024-01-01T00:00:00Z",
  validUntil: "2024-12-31T23:59:59Z",
  conditions: [
    {
      conditionType: "minimum_quantity",
      conditionValue: "2",
      isInclusive: true
    }
  ]
};

const response = await fetch('/api/coupons', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(couponData)
});
```

### Creating a Buy X Get Y Coupon
```javascript
const buyXGetYCoupon = {
  code: "BUY2GET1",
  name: "Buy 2 Get 1 Free",
  type: "buy_x_get_y",
  value: 0,
  validFrom: "2024-01-01T00:00:00Z",
  validUntil: "2024-06-30T23:59:59Z",
  buyXGetY: {
    buyQuantity: 2,
    getQuantity: 1,
    buyCategoryIds: [1, 2, 3],
    getCategoryIds: [1, 2, 3],
    getDiscountType: "free",
    getDiscountValue: 0
  }
};
```

### Validating a Coupon
```javascript
const validationData = {
  couponCode: "SAVE20",
  cartTotal: 150.00,
  cartItems: [
    {
      productId: 1,
      categoryId: 1,
      quantity: 2,
      price: 50.00
    }
  ],
  userId: "user-uuid"
};

const response = await fetch('/api/coupons/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(validationData)
});

const result = await response.json();
if (result.success) {
  console.log(`Discount: $${result.data.discountAmount}`);
} else {
  console.log(`Error: ${result.message}`);
}
```

### Applying a Coupon to Cart
```javascript
const applyData = {
  couponCode: "SAVE20",
  cartId: 123,
  userId: "user-uuid"
};

const response = await fetch('/api/coupons/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(applyData)
});
```

## 🎯 Response Formats

### Coupon Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "SAVE20",
    "name": "20% Off Everything",
    "description": "Get 20% off your entire order",
    "type": "percentage",
    "value": "20.00",
    "minimumOrderAmount": "50.00",
    "maximumDiscountAmount": "100.00",
    "usageLimit": 1000,
    "usageCount": 45,
    "userUsageLimit": 1,
    "isActive": true,
    "isPublic": true,
    "stackable": false,
    "firstTimeCustomerOnly": false,
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2024-12-31T23:59:59Z",
    "conditions": [
      {
        "id": 1,
        "conditionType": "minimum_quantity",
        "conditionValue": "2",
        "isInclusive": true
      }
    ],
    "buyXGetY": null,
    "creator": {
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

### Validation Response (Valid)
```json
{
  "success": true,
  "message": "Coupon is valid",
  "data": {
    "coupon": { /* coupon object */ },
    "discountAmount": 30.00,
    "applicableItems": [
      {
        "productId": 1,
        "quantity": 2,
        "originalPrice": 50.00,
        "discountedPrice": 40.00,
        "discountAmount": 20.00
      }
    ]
  }
}
```

### Validation Response (Invalid)
```json
{
  "success": false,
  "message": "Coupon has expired or is not yet valid"
}
```

## 🔧 Advanced Features

### Condition System

**Product Conditions:**
```json
{
  "conditionType": "product",
  "conditionValue": "[1, 2, 3]", // Product IDs
  "isInclusive": true // Must include these products
}
```

**Category Conditions:**
```json
{
  "conditionType": "category", 
  "conditionValue": "[1, 2]", // Category IDs
  "isInclusive": false // Exclude these categories
}
```

**Quantity Conditions:**
```json
{
  "conditionType": "minimum_quantity",
  "conditionValue": "5", // Minimum items required
  "isInclusive": true
}
```

### Buy X Get Y Configurations

**Simple BOGO:**
```json
{
  "buyQuantity": 1,
  "getQuantity": 1,
  "buyCategoryIds": [1],
  "getCategoryIds": [1],
  "getDiscountType": "free"
}
```

**Cross-Category Promotion:**
```json
{
  "buyQuantity": 2,
  "getQuantity": 1,
  "buyCategoryIds": [1, 2], // Buy from categories 1 or 2
  "getCategoryIds": [3, 4], // Get free from categories 3 or 4
  "getDiscountType": "percentage",
  "getDiscountValue": 50
}
```

**Product-Specific BOGO:**
```json
{
  "buyQuantity": 3,
  "getQuantity": 1,
  "buyProductIds": [10, 11, 12],
  "getProductIds": [13, 14, 15],
  "getDiscountType": "fixed_amount",
  "getDiscountValue": 10
}
```

## 📊 Analytics & Reporting

### Usage Statistics
- Total coupons created
- Active vs inactive coupons
- Total redemptions
- Total discount amount given
- Average discount per order
- Conversion rates by coupon type

### Performance Metrics
- Most popular coupons
- Usage trends over time
- Customer acquisition via coupons
- Revenue impact analysis
- ROI calculations

### Business Intelligence
- Coupon effectiveness by category
- Customer lifetime value impact
- Seasonal usage patterns
- A/B testing results

## 🔒 Security & Validation

### Input Validation
- Coupon code format validation (uppercase, alphanumeric)
- Date range validation
- Percentage limits (0-100%)
- Usage limit constraints
- Condition value validation

### Fraud Prevention
- Usage limit enforcement
- User-specific redemption tracking
- IP-based rate limiting
- Duplicate prevention
- Audit trail logging

### Data Protection
- Secure coupon code generation
- Usage history encryption
- Admin action logging
- GDPR compliance for user data

## 🚀 Performance Optimizations

### Database Optimizations
- Comprehensive indexing strategy
- Efficient query patterns
- Usage count caching
- Condition evaluation optimization

### Caching Strategy
- Active coupons cached for 5 minutes
- User-specific coupons cached for 10 minutes
- Public coupons cached for 1 hour
- Statistics cached for 30 minutes

### Query Optimization
- Batch condition evaluation
- Efficient JOIN operations
- Pagination optimization
- Index-based filtering

## 🧪 Testing

### Test Coverage
- Unit tests for all service methods
- Integration tests for API endpoints
- Validation testing for all schemas
- Edge case testing for complex conditions
- Performance testing for high-volume usage

### Bruno API Tests
- Complete test suite for all endpoints
- Validation scenarios for all coupon types
- Error handling verification
- Complex condition testing

## 🔮 Future Enhancements

### Planned Features
1. **AI-Powered Recommendations**
   - Personalized coupon suggestions
   - Optimal discount amount calculation
   - Customer behavior analysis

2. **Advanced Targeting**
   - Geographic targeting
   - Purchase history-based offers
   - Behavioral triggers
   - Lifecycle stage targeting

3. **Social Features**
   - Referral coupons
   - Social sharing bonuses
   - Group buying discounts
   - Influencer partnerships

4. **Dynamic Pricing**
   - Real-time discount optimization
   - Inventory-based adjustments
   - Competitor price matching
   - Demand-based pricing

5. **Integration Enhancements**
   - Email marketing platform integration
   - CRM system synchronization
   - Analytics platform connections
   - Third-party promotion networks

### Technical Improvements
1. **Performance Scaling**
   - Redis caching layer
   - Database sharding
   - CDN integration
   - Microservices architecture

2. **Advanced Analytics**
   - Real-time dashboards
   - Predictive analytics
   - Machine learning insights
   - Custom reporting tools

## 📚 Integration Examples

### Frontend Integration
```javascript
// React coupon component
const CouponInput = ({ onApplyCoupon }) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleApply = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode,
          cartTotal: cart.total,
          cartItems: cart.items,
          userId: user.id
        })
      });

      const result = await response.json();
      if (result.success) {
        onApplyCoupon(result.data);
      } else {
        setError(result.message);
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      <input 
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        placeholder="Enter coupon code"
      />
      <button onClick={handleApply} disabled={isValidating}>
        {isValidating ? 'Validating...' : 'Apply'}
      </button>
    </div>
  );
};
```

### Admin Dashboard Integration
```javascript
// Admin coupon management
const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [filters, setFilters] = useState({});

  const fetchCoupons = async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/coupons?${params}`);
    const data = await response.json();
    setCoupons(data.data.coupons);
  };

  const createCoupon = async (couponData) => {
    const response = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(couponData)
    });
    
    if (response.ok) {
      fetchCoupons(); // Refresh list
    }
  };

  return (
    <div>
      <CouponFilters onFilterChange={setFilters} />
      <CouponList coupons={coupons} />
      <CreateCouponModal onSubmit={createCoupon} />
    </div>
  );
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Coupon Not Applying**
   - Check coupon is active and within validity period
   - Verify minimum order amount is met
   - Check usage limits haven't been exceeded
   - Validate cart items meet conditions

2. **Validation Errors**
   - Ensure coupon code format is correct
   - Check cart total and items are properly formatted
   - Verify user ID format if provided

3. **Performance Issues**
   - Check database indexes are in place
   - Monitor query performance for complex conditions
   - Verify caching is working properly

### Debug Information
- Use coupon statistics endpoint for usage data
- Check application logs for validation details
- Monitor database performance for slow queries
- Use admin interface for coupon status verification

The coupon system provides a comprehensive, scalable solution for discount management that supports complex promotional strategies while maintaining performance and security standards.