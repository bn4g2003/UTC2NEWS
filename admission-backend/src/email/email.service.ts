import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AdmissionEmailData } from './email-queue.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendAdmissionResultEmail(
    to: string,
    data: AdmissionEmailData,
  ): Promise<void> {
    const subject = data.isAdmitted 
      ? '🎉 Chúc mừng! Bạn đã trúng tuyển - Admission Result'
      : 'Thông báo kết quả xét tuyển - Admission Result';
    
    const html = data.isAdmitted 
      ? this.generateAdmittedEmailTemplate(data)
      : this.generateNotAdmittedEmailTemplate(data);

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@admission.edu.vn',
      to,
      subject,
      html,
    });
  }

  private generateAdmittedEmailTemplate(data: AdmissionEmailData): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả xét tuyển</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .result-box { background: #e8f5e9; border-left: 5px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .result-box h2 { color: #2e7d32; margin: 0 0 10px 0; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #555; }
    .value { color: #000; font-weight: 500; }
    .note { background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Thông Báo Kết Quả Xét Tuyển</h1>
      <p>Admission Result Notification</p>
    </div>
    
    <div class="content">
      <p><strong>Kính gửi:</strong> ${data.studentName}</p>
      
      <p>Trường Đại học xin trân trọng thông báo kết quả xét tuyển của bạn.</p>
      
      <div class="result-box">
        <h2>🎉 CHÚC MỪNG! CONGRATULATIONS!</h2>
        <p>Bạn đã <strong>TRÚNG TUYỂN</strong> vào chương trình đào tạo của trường!</p>
      </div>
      
      <h3>📋 Thông tin trúng tuyển</h3>
      
      <div class="info-row">
        <span class="label">🎯 Ngành học:</span>
        <span class="value">${data.majorName}</span>
      </div>
      
      <div class="info-row">
        <span class="label">📝 Phương thức:</span>
        <span class="value">${this.formatAdmissionMethod(data.admissionMethod)}</span>
      </div>
      
      <div class="info-row">
        <span class="label">⭐ Nguyện vọng:</span>
        <span class="value">Nguyện vọng ${data.preference}</span>
      </div>
      
      <div class="info-row">
        <span class="label">📊 Điểm xét tuyển:</span>
        <span class="value" style="color: #4caf50; font-size: 18px;">${data.finalScore.toFixed(2)}</span>
      </div>
      
      <div class="note">
        <h4>⚠️ Lưu ý quan trọng</h4>
        <ul>
          <li>Xác nhận nhập học trong vòng 7 ngày</li>
          <li>Chuẩn bị và nộp đầy đủ hồ sơ nhập học</li>
          <li>Kiểm tra thông báo chính thức trên website</li>
        </ul>
      </div>
      
      <p><strong>📞 Liên hệ:</strong></p>
      <p>Email: tuyensinh@utc2.edu.vn | Điện thoại: (028) 3512 0808</p>
      
      <p style="margin-top: 30px;">Trân trọng,<br><strong>Ban Tuyển sinh</strong></p>
    </div>
    
    <div class="footer">
      <p><strong>⚡ Email tự động</strong></p>
      <p>Đây là email được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.</p>
      <p>© 2026 University Admission System</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateNotAdmittedEmailTemplate(data: AdmissionEmailData): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả xét tuyển</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .result-box { background: #fff3e0; border-left: 5px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Thông Báo Kết Quả Xét Tuyển</h1>
      <p>Admission Result Notification</p>
    </div>
    
    <div class="content">
      <p><strong>Kính gửi:</strong> ${data.studentName}</p>
      
      <p>Trường Đại học xin trân trọng thông báo kết quả xét tuyển của bạn.</p>
      
      <div class="result-box">
        <p>Rất tiếc, bạn <strong>chưa đủ điều kiện trúng tuyển</strong> trong đợt xét tuyển này.</p>
      </div>
      
      <p>Chúng tôi chúc bạn thành công trong tương lai!</p>
      
      <p><strong>📞 Liên hệ:</strong></p>
      <p>Email: tuyensinh@utc2.edu.vn | Điện thoại: (028) 3512 0808</p>
      
      <p style="margin-top: 30px;">Trân trọng,<br><strong>Ban Tuyển sinh</strong></p>
    </div>
    
    <div class="footer">
      <p><strong>⚡ Email tự động</strong></p>
      <p>Đây là email được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.</p>
      <p>© 2026 University Admission System</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private formatAdmissionMethod(method: string): string {
    const methodMap: Record<string, string> = {
      entrance_exam: 'Xét tuyển theo kỳ thi đầu vào',
      high_school_transcript: 'Xét tuyển học bạ THPT',
      direct_admission: 'Xét tuyển thẳng',
      competency_assessment: 'Đánh giá năng lực',
      international_exam: 'Chứng chỉ quốc tế',
    };
    return methodMap[method] || method;
  }
}
