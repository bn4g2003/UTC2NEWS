import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AdmissionEmailData } from './email-queue.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendAdmissionResultEmail(
    to: string,
    data: AdmissionEmailData,
  ): Promise<void> {
    const subject = 'Kết quả xét tuyển - Admission Result';
    const html = this.generateAdmissionEmailTemplate(data);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@admission.edu.vn',
      to,
      subject,
      html,
    });
  }

  private generateAdmissionEmailTemplate(data: AdmissionEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 0 0 5px 5px;
    }
    .result-box {
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px;
      margin: 20px 0;
    }
    .info-row {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #000;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>THÔNG BÁO KẾT QUẢ XÉT TUYỂN</h1>
    <p>ADMISSION RESULT NOTIFICATION</p>
  </div>
  
  <div class="content">
    <p>Kính gửi: <strong>${data.studentName}</strong></p>
    <p>Dear: <strong>${data.studentName}</strong></p>
    
    <div class="result-box">
      <h2 style="margin-top: 0; color: #4caf50;">🎉 CHÚC MỪNG! CONGRATULATIONS!</h2>
      <p>Bạn đã trúng tuyển vào chương trình đào tạo của trường chúng tôi.</p>
      <p>You have been admitted to our institution.</p>
    </div>
    
    <h3>Thông tin trúng tuyển / Admission Information:</h3>
    
    <div class="info-row">
      <span class="label">Ngành học / Major:</span>
      <span class="value">${data.majorName}</span>
    </div>
    
    <div class="info-row">
      <span class="label">Phương thức xét tuyển / Admission Method:</span>
      <span class="value">${this.formatAdmissionMethod(data.admissionMethod)}</span>
    </div>
    
    <div class="info-row">
      <span class="label">Nguyện vọng trúng tuyển / Admitted Preference:</span>
      <span class="value">NV${data.preference}</span>
    </div>
    
    <div class="info-row">
      <span class="label">Điểm xét tuyển / Final Score:</span>
      <span class="value">${data.finalScore.toFixed(2)}</span>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>Lưu ý quan trọng / Important Notes:</strong></p>
      <ul style="margin: 10px 0;">
        <li>Vui lòng xác nhận nhập học theo hướng dẫn trên website của trường.</li>
        <li>Please confirm your enrollment following the instructions on our website.</li>
        <li>Hạn chót xác nhận: Vui lòng kiểm tra thông báo chính thức.</li>
        <li>Confirmation deadline: Please check the official announcement.</li>
      </ul>
    </div>
    
    <p style="margin-top: 30px;">
      Trân trọng,<br>
      <strong>Ban Tuyển sinh</strong><br>
      Admission Office
    </p>
  </div>
  
  <div class="footer">
    <p>Email này được gửi tự động. Vui lòng không trả lời email này.</p>
    <p>This is an automated email. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `;
  }

  private formatAdmissionMethod(method: string): string {
    const methodMap: Record<string, string> = {
      entrance_exam: 'Xét tuyển theo kỳ thi / Entrance Exam',
      high_school_transcript: 'Xét tuyển học bạ / High School Transcript',
      direct_admission: 'Xét tuyển thẳng / Direct Admission',
    };
    return methodMap[method] || method;
  }
}
