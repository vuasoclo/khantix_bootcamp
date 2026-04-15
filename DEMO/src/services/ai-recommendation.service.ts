interface RecommendationRequest {
    client_industry: string;
    project_complexity: string;
    total_list_price: number;
    total_floor_cost: number;
}

export const getAIPriceRecommendation = async (data: RecommendationRequest) => {
    // Giả lập gọi HTTP request sang service Python
    const floorCost = data.total_floor_cost;
    const listPrice = data.total_list_price;
    const padding = (listPrice - floorCost);
    
    // AI Rules: Đề xuất mức giảm giá để chốt hạ với Win Rate 85%
    const recommendedDiscountAmount = padding * 0.40; 
    const recommendedPrice = listPrice - recommendedDiscountAmount;
    const recommendedDiscountPct = (recommendedDiscountAmount / listPrice) * 100;

    return {
        recommended_discount_pct: parseFloat(recommendedDiscountPct.toFixed(2)),
        recommended_offered_price: parseFloat(recommendedPrice.toFixed(2)),
        win_probability: 85.0 
    };
};
