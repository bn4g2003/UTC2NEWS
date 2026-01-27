'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportReportButtonProps {
  projectId: string;
  projectName: string;
}

export function ExportReportButton({ projectId, projectName }: ExportReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      // TODO: Implement CSV export
      alert('Tính năng xuất CSV đang được phát triển');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Không thể xuất báo cáo CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      // TODO: Implement PDF export
      alert('Tính năng xuất PDF đang được phát triển');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Không thể xuất báo cáo PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Đang xuất...' : 'Xuất báo cáo'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Xuất Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Xuất PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
