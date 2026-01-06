import { ProductReview, ProductRatingSummary, ReviewQuestion, ReviewAnswer } from '../models/reviews.schema';

/**
 * Map review to public DTO (hide sensitive information)
 */
export const toReviewPublicDto = (review: any) => {
  return {
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: review.isVerifiedPurchase,
    isRecommended: review.isRecommended,
    helpfulCount: review.helpfulCount,
    unhelpfulCount: review.unhelpfulCount,
    createdAt: review.createdAt,
    user: review.user ? {
      firstName: review.user.firstName,
      lastName: review.user.lastName,
      // Hide full name for privacy, show initials
      displayName: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`
    } : null,
    media: review.media || [],
    userHelpfulness: review.userHelpfulness,
  };
};

/**
 * Map review to admin DTO (include all information)
 */
export const toReviewAdminDto = (review: any) => {
  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    orderId: review.orderId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: review.isVerifiedPurchase,
    isRecommended: review.isRecommended,
    helpfulCount: review.helpfulCount,
    unhelpfulCount: review.unhelpfulCount,
    isApproved: review.isApproved,
    moderatorNotes: review.moderatorNotes,
    moderatedBy: review.moderatedBy,
    moderatedAt: review.moderatedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    media: review.media || [],
    userHelpfulness: review.userHelpfulness,
  };
};

/**
 * Map rating summary to DTO
 */
export const toRatingSummaryDto = (summary: ProductRatingSummary | null) => {
  if (!summary) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      verifiedPurchaseCount: 0,
      recommendedCount: 0,
      recommendationRate: 0,
      lastReviewAt: null,
    };
  }

  const recommendationRate = (summary.totalReviews || 0) > 0 
    ? Math.round(((summary.recommendedCount || 0) / (summary.totalReviews || 1)) * 100) 
    : 0;

  return {
    totalReviews: summary.totalReviews,
    averageRating: Number(summary.averageRating),
    ratingDistribution: {
      1: summary.rating1Count,
      2: summary.rating2Count,
      3: summary.rating3Count,
      4: summary.rating4Count,
      5: summary.rating5Count,
    },
    verifiedPurchaseCount: summary.verifiedPurchaseCount,
    recommendedCount: summary.recommendedCount,
    recommendationRate,
    lastReviewAt: summary.lastReviewAt,
  };
};

/**
 * Map question to public DTO
 */
export const toQuestionPublicDto = (question: any) => {
  return {
    id: question.id,
    productId: question.productId,
    question: question.question,
    answerCount: question.answerCount,
    createdAt: question.createdAt,
    user: question.user ? {
      displayName: `${question.user.firstName} ${question.user.lastName.charAt(0)}.`
    } : null,
  };
};

/**
 * Map answer to public DTO
 */
export const toAnswerPublicDto = (answer: any) => {
  return {
    id: answer.id,
    questionId: answer.questionId,
    answer: answer.answer,
    isVerifiedPurchase: answer.isVerifiedPurchase,
    helpfulCount: answer.helpfulCount,
    createdAt: answer.createdAt,
    user: answer.user ? {
      displayName: `${answer.user.firstName} ${answer.user.lastName.charAt(0)}.`
    } : null,
  };
};

/**
 * Generate star rating display
 */
export const generateStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

/**
 * Calculate review statistics
 */
export const calculateReviewStats = (reviews: ProductReview[]) => {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPurchaseRate: 0,
      recommendationRate: 0,
    };
  }

  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / totalReviews;
  
  const ratingDistribution = reviews.reduce((dist, review) => {
    dist[review.rating as keyof typeof dist]++;
    return dist;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const verifiedPurchases = reviews.filter(r => r.isVerifiedPurchase).length;
  const recommendations = reviews.filter(r => r.isRecommended).length;

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 100) / 100,
    ratingDistribution,
    verifiedPurchaseRate: Math.round((verifiedPurchases / totalReviews) * 100),
    recommendationRate: Math.round((recommendations / totalReviews) * 100),
  };
};