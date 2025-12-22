# Product Review & Rating System

This document outlines the comprehensive product review and rating system implemented in the e-commerce API.

## 🌟 Overview

The review system provides Amazon-level functionality for product reviews, ratings, questions & answers, and comprehensive analytics. It includes moderation capabilities, media support, and advanced filtering options.

## 📊 Core Features

### 1. Product Reviews
- **5-star rating system** with detailed reviews
- **Verified purchase badges** for authenticated buyers
- **Review media support** (images/videos up to 5 per review)
- **Recommendation system** (thumbs up/down)
- **Helpfulness voting** by other users
- **Review moderation** with approval workflow

### 2. Questions & Answers
- **Product-specific Q&A** system
- **Community-driven answers** from verified and unverified users
- **Answer helpfulness voting**
- **Moderation and approval** workflow

### 3. Rating Analytics
- **Aggregated rating summaries** for performance
- **Rating distribution** (1-5 star breakdown)
- **Verification statistics** (verified vs unverified purchases)
- **Recommendation rates** and trends

### 4. Advanced Features
- **Review helpfulness tracking** with user voting
- **Media attachments** with thumbnails and captions
- **Comprehensive filtering** and sorting options
- **Admin moderation tools** with notes and approval status
- **Real-time statistics** and analytics

## 🗄️ Database Schema

### Core Tables

#### `product_reviews`
```sql
- id (serial, primary key)
- product_id (integer, foreign key)
- user_id (uuid, foreign key)
- order_id (integer, optional - for verified purchases)
- rating (integer, 1-5)
- title (varchar, optional)
- comment (text, optional)
- is_verified_purchase (boolean)
- is_recommended (boolean)
- helpful_count (integer)
- unhelpful_count (integer)
- is_approved (boolean, for moderation)
- moderator_notes (text)
- moderated_by (uuid)
- moderated_at (timestamp)
- created_at, updated_at (timestamps)
```

#### `review_helpfulness`
```sql
- id (serial, primary key)
- review_id (integer, foreign key)
- user_id (uuid, foreign key)
- is_helpful (boolean)
- created_at (timestamp)
```

#### `review_media`
```sql
- id (serial, primary key)
- review_id (integer, foreign key)
- media_type (varchar - 'image', 'video')
- media_url (text)
- thumbnail_url (text, optional)
- caption (text, optional)
- display_order (integer)
- created_at (timestamp)
```

#### `product_rating_summary`
```sql
- id (serial, primary key)
- product_id (integer, unique foreign key)
- total_reviews (integer)
- average_rating (decimal 3,2)
- rating_1_count through rating_5_count (integers)
- verified_purchase_count (integer)
- recommended_count (integer)
- last_review_at (timestamp)
- updated_at (timestamp)
```

#### `review_questions` & `review_answers`
```sql
-- Questions table
- id, product_id, user_id, question, is_approved, answer_count, timestamps

-- Answers table  
- id, question_id, user_id, answer, is_verified_purchase, is_approved, helpful_count, timestamps
```

## 🚀 API Endpoints

### Review Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Create new product review |
| GET | `/api/reviews/products/{productId}` | Get reviews for product |
| GET | `/api/reviews/{reviewId}` | Get specific review |
| POST | `/api/reviews/{reviewId}/helpful` | Vote on review helpfulness |
| GET | `/api/reviews/products/{productId}/summary` | Get rating summary |

### Questions & Answers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/questions` | Create product question |
| GET | `/api/reviews/products/{productId}/questions` | Get product questions |
| POST | `/api/reviews/questions/{questionId}/answers` | Create answer |
| GET | `/api/reviews/questions/{questionId}/answers` | Get question answers |

### Analytics & Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/statistics` | Get review statistics |

## 📝 Usage Examples

### Creating a Review
```javascript
const reviewData = {
  productId: 123,
  rating: 5,
  title: "Excellent product!",
  comment: "This product exceeded my expectations. Great quality and fast shipping.",
  isRecommended: true,
  mediaUrls: [
    "https://example.com/review-image-1.jpg",
    "https://example.com/review-image-2.jpg"
  ]
};

const response = await fetch('/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reviewData)
});
```

### Getting Product Reviews with Filters
```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '10',
  rating: '5',
  sortBy: 'helpful',
  verifiedOnly: 'true',
  withMedia: 'false'
});

const response = await fetch(`/api/reviews/products/123?${params}`);
const data = await response.json();

console.log(data.data.reviews); // Array of reviews
console.log(data.data.summary); // Rating summary
```

### Voting on Review Helpfulness
```javascript
const response = await fetch('/api/reviews/456/helpful', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isHelpful: true })
});
```

## 🎯 Response Formats

### Review Response
```json
{
  "success": true,
  "data": {
    "id": 123,
    "productId": 456,
    "rating": 5,
    "title": "Great product!",
    "comment": "Highly recommended...",
    "isVerifiedPurchase": true,
    "isRecommended": true,
    "helpfulCount": 15,
    "unhelpfulCount": 2,
    "createdAt": "2024-01-15T10:30:00Z",
    "user": {
      "displayName": "John D."
    },
    "media": [
      {
        "id": 789,
        "mediaType": "image",
        "mediaUrl": "https://example.com/image.jpg",
        "thumbnailUrl": "https://example.com/thumb.jpg",
        "caption": "Product in use"
      }
    ],
    "userHelpfulness": {
      "isHelpful": true
    }
  }
}
```

### Rating Summary Response
```json
{
  "success": true,
  "data": {
    "totalReviews": 150,
    "averageRating": 4.3,
    "ratingDistribution": {
      "1": 5,
      "2": 8,
      "3": 22,
      "4": 45,
      "5": 70
    },
    "verifiedPurchaseCount": 120,
    "recommendedCount": 135,
    "recommendationRate": 90,
    "lastReviewAt": "2024-01-20T15:45:00Z"
  }
}
```

## 🔧 Advanced Features

### Review Filtering & Sorting

**Filter Options:**
- Rating (1-5 stars)
- Verified purchases only
- Reviews with media only
- Date ranges

**Sort Options:**
- Newest first (default)
- Oldest first
- Highest rating first
- Lowest rating first
- Most helpful first

### Media Support

**Supported Media Types:**
- Images (JPEG, PNG, WebP)
- Videos (MP4, WebM)
- Maximum 5 media files per review
- Automatic thumbnail generation
- Caption support

### Moderation System

**Review Moderation:**
- Automatic approval for verified purchases (configurable)
- Manual moderation queue for admin review
- Moderator notes and approval tracking
- Bulk moderation actions

**Content Guidelines:**
- Minimum comment length: 10 characters
- Maximum comment length: 2000 characters
- Profanity filtering (to be implemented)
- Spam detection (to be implemented)

## 📊 Analytics & Insights

### Review Statistics
- Total reviews over time
- Average rating trends
- Rating distribution analysis
- Verified vs unverified purchase rates
- Recommendation rates
- Review helpfulness metrics

### Business Intelligence
- Product performance insights
- Customer satisfaction trends
- Review quality metrics
- Moderation workload analytics

## 🔒 Security & Privacy

### Data Protection
- User names are displayed as initials for privacy
- Email addresses are never exposed in public APIs
- Review content is sanitized for XSS protection
- Rate limiting on review creation

### Abuse Prevention
- One review per user per product (configurable)
- Helpfulness vote limits per user
- Review editing restrictions
- Automated spam detection (planned)

## 🚀 Performance Optimizations

### Database Optimizations
- Comprehensive indexing strategy
- Aggregated rating summaries for fast lookups
- Efficient pagination with offset/limit
- Query optimization for complex filters

### Caching Strategy
- Rating summaries cached for 5 minutes
- Popular reviews cached for 1 hour
- Question/answer caching for 30 minutes
- CDN caching for media files

## 🧪 Testing

### Test Coverage
- Unit tests for all service methods
- Integration tests for API endpoints
- Database transaction testing
- Edge case validation testing

### Bruno API Tests
- Complete test suite for all endpoints
- Validation testing for all input schemas
- Error handling verification
- Performance testing scenarios

## 🔮 Future Enhancements

### Planned Features
1. **AI-Powered Insights**
   - Sentiment analysis of reviews
   - Automatic review summarization
   - Fake review detection

2. **Enhanced Media Support**
   - Video review support
   - 360-degree product photos
   - AR/VR integration

3. **Social Features**
   - Review sharing on social media
   - Follow other reviewers
   - Review collections and lists

4. **Advanced Analytics**
   - Predictive rating analytics
   - Review impact on sales
   - Customer journey insights

5. **Internationalization**
   - Multi-language review support
   - Automatic translation
   - Regional review preferences

### Performance Improvements
1. **Search Integration**
   - Elasticsearch for review search
   - Full-text search across reviews
   - Advanced filtering capabilities

2. **Real-time Features**
   - WebSocket notifications for new reviews
   - Live review updates
   - Real-time moderation alerts

3. **Mobile Optimization**
   - Mobile-first review interface
   - Voice review recording
   - Camera integration for photos

## 📚 Integration Examples

### Frontend Integration
```javascript
// React component example
const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchReviews(productId, filters);
  }, [productId, filters]);

  const fetchReviews = async (productId, filters) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/reviews/products/${productId}?${params}`);
    const data = await response.json();
    
    setReviews(data.data.reviews);
    setSummary(data.data.summary);
  };

  return (
    <div>
      <RatingSummary summary={summary} />
      <ReviewFilters onFilterChange={setFilters} />
      <ReviewList reviews={reviews} />
    </div>
  );
};
```

### Admin Dashboard Integration
```javascript
// Admin review moderation
const ReviewModerationQueue = () => {
  const [pendingReviews, setPendingReviews] = useState([]);

  const approveReview = async (reviewId) => {
    await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        isApproved: true,
        moderatorNotes: 'Approved - meets guidelines'
      })
    });
    
    // Refresh list
    fetchPendingReviews();
  };

  return (
    <div>
      {pendingReviews.map(review => (
        <ReviewModerationCard 
          key={review.id}
          review={review}
          onApprove={() => approveReview(review.id)}
        />
      ))}
    </div>
  );
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Review Not Appearing**
   - Check if review is approved (`is_approved = true`)
   - Verify product exists and is active
   - Check user permissions

2. **Rating Summary Not Updating**
   - Verify `updateProductRatingSummary` is called after review creation
   - Check for database transaction issues
   - Ensure proper indexing on product_id

3. **Media Upload Issues**
   - Verify media URLs are accessible
   - Check file size and format restrictions
   - Ensure proper CDN configuration

### Debug Endpoints
- Review detailed logs in application logs
- Use admin statistics endpoint for data verification
- Check database constraints and foreign keys

The review system provides a comprehensive, scalable solution for product reviews and ratings that matches the functionality of major e-commerce platforms while maintaining performance and security standards.