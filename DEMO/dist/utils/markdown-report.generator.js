"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarkdownReport = generateMarkdownReport;
const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
/**
 * Đóng gói kết quả tính toán COCOMO thành Báo cáo định dạng Markdown (Explainable Report)
 */
function generateMarkdownReport(sessionId, result) {
    const { recommendedPrice, narrative, costLineItems, riskAdjustments, marginBreakdown, _debug } = result;
    const lines = [];
    // ─── Header ─────────────────────────────────────────────────────────────
    lines.push(`# 📊 KHantix Báo Giá Giải Trình (Explainable Report)`);
    lines.push(`**Mã phiên:** \`${sessionId}\``);
    lines.push(`**Thời gian tạo:** ${new Date().toLocaleString('vi-VN')}`);
    lines.push('');
    // ─── Executive Summary ──────────────────────────────────────────────────
    lines.push(`## 1. Tóm Tắt (Executive Summary)`);
    lines.push(`- **Giá Đề Xuất (Recommended Price):** **${formatVND(recommendedPrice)}**`);
    lines.push(`- **Tổng Effort Gốc:** ${_debug.baseManDays} man-days`);
    lines.push(`- **Tổng Effort Đã Điều Chỉnh (Sau rủi ro):** ${Math.round(_debug.adjustedManDays)} man-days`);
    lines.push(`- **Hệ số rủi ro gộp (Compound Multiplier):** ×${_debug.compoundMultiplier.toFixed(3)}`);
    lines.push('');
    lines.push(`**Diễn giải nhanh:**`);
    for (const p of narrative) {
        lines.push(`> ${p}`);
    }
    lines.push('');
    // ─── Lớp 1: Base Cost ───────────────────────────────────────────────────
    lines.push(`## 2. Chi Phí Nền Tảng (Base Cost - Phân rã Lớp 1)`);
    lines.push(`Tổng chi phí gốc: **${formatVND(_debug.baseCost)}**`);
    lines.push('');
    lines.push(`| Hạng mục | Chi phí | Diễn giải |`);
    lines.push(`| :--- | :--- | :--- |`);
    for (const item of costLineItems) {
        lines.push(`| **${item.category}** | ${formatVND(item.amount)} | ${item.explanation} |`);
    }
    lines.push('');
    // ─── Lớp 2: Risk Multipliers ─────────────────────────────────────────────
    lines.push(`## 3. Hệ Số Rủi Ro COCOMO (Phân rã Lớp 2)`);
    if (riskAdjustments.length === 0) {
        lines.push(`*Không ghi nhận tham số rủi ro nào làm tăng effort trong dự án này.*`);
    }
    else {
        lines.push(`Dựa trên việc bóc tách yêu cầu, hệ thống ghi nhận các yếu tố rủi ro sau làm thay đổi tổng Effort của team Dev:`);
        lines.push('');
        for (const risk of riskAdjustments) {
            lines.push(`### ⚠️ Yếu tố: ${risk.dimension}`);
            lines.push(`- **Hệ số tăng (Buffer Apply):** +${(risk.bufferApplied * 100).toFixed(1)}%`);
            lines.push(`- **Man-days đội thêm:** \`~${risk.extraDays} days\``);
            lines.push(`- **Mức độ / Confidence:** ${risk.level}`);
            lines.push(`- **Lý do (AI suy luận & Bằng chứng):** ${risk.why}`);
            lines.push('');
        }
    }
    // ─── Lớp 3: Commercial & Margin ──────────────────────────────────────────
    lines.push(`## 4. Biên Độ Thương Mại (Commercial & Margin - Phân rã Lớp 3)`);
    lines.push(`Cơ cấu Margin: **${(marginBreakdown.totalMarginPct * 100).toFixed(1)}%** (Tương đương ${formatVND(marginBreakdown.totalMarginAmount)})`);
    lines.push('');
    lines.push(`| Hạng Mục Margin | Tỉ lệ % |`);
    lines.push(`| :--- | :--- |`);
    lines.push(`| 💰 Lợi nhuận ròng (Net Profit) | ${(marginBreakdown.netProfitPct * 100).toFixed(1)}% |`);
    lines.push(`| 🛡️ Cấp phối rủi ro (Risk Premium) | ${(marginBreakdown.riskPremiumPct * 100).toFixed(1)}% |`);
    lines.push(`| 🚀 Tái đầu tư (Reinvestment) | ${(marginBreakdown.reinvestmentPct * 100).toFixed(1)}% |`);
    lines.push('');
    lines.push(`> *Chính sách thương mại bổ sung (nếu có) như Rush Factor, Enterprise Logo Discount hoặc Payment Early Discount đã được áp dụng vào Giá Đề Xuất cuối cùng ở Mục 1.*`);
    lines.push('');
    lines.push(`---`);
    lines.push(`*Báo cáo được tự động tạo bởi KHantix AI CPQ System.*`);
    return lines.join('\n');
}
