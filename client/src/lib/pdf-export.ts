import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportData {
  asset: string;
  timeframe: string;
  currentPrice: number;
  indicators: Record<string, any>;
  signals: any[];
  marketData: any;
  condition: any;
  timestamp: string;
}

export async function exportToPDF(data: ExportData, chartElement: HTMLElement | null) {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(66, 133, 244);
    pdf.text("TradingDash Report", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 12;
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 12;

    // Section: Asset & Price
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Current Market Data", 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(50, 50, 50);
    pdf.text(`Asset: ${data.asset}`, 15, yPosition);
    yPosition += 6;
    pdf.text(`Price: $${data.currentPrice.toFixed(2)}`, 15, yPosition);
    yPosition += 6;
    pdf.text(`Timeframe: ${data.timeframe}`, 15, yPosition);
    yPosition += 6;
    pdf.text(`Market Status: ${data.marketData ? "Open" : "Closed"}`, 15, yPosition);

    yPosition += 10;

    // Section: Technical Indicators
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Technical Indicators", 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);

    const indicatorKeys = Object.keys(data.indicators || {});
    if (indicatorKeys.length > 0) {
      indicatorKeys.slice(0, 8).forEach((key) => {
        const value = data.indicators[key];
        const displayValue =
          typeof value === "number" ? value.toFixed(2) : JSON.stringify(value);
        pdf.text(`${key}: ${displayValue}`, 15, yPosition);
        yPosition += 5;
      });
    } else {
      pdf.text("No indicator data available", 15, yPosition);
      yPosition += 5;
    }

    yPosition += 5;

    // Section: Trading Signals
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Trading Signals", 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);

    if (data.signals && data.signals.length > 0) {
      data.signals.slice(0, 5).forEach((signal, idx) => {
        const signalText = `${idx + 1}. ${signal.type || "N/A"} - ${signal.confluence || 0}% confluence`;
        pdf.text(signalText, 15, yPosition);
        yPosition += 5;
      });
    } else {
      pdf.text("No trading signals available", 15, yPosition);
      yPosition += 5;
    }

    yPosition += 5;

    // Section: Market Condition
    if (data.condition) {
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Market Condition", 15, yPosition);

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);

      const conditionText = `Trend: ${data.condition.trend || "Unknown"} | Strength: ${data.condition.strength || "N/A"}`;
      pdf.text(conditionText, 15, yPosition);
      yPosition += 5;
    }

    // Try to add chart screenshot if element provided
    if (chartElement) {
      const newPage = yPosition > pageHeight - 80;
      if (newPage) {
        pdf.addPage();
        yPosition = 15;
      } else {
        yPosition += 10;
      }

      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: "#ffffff",
          scale: 2,
        });

        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight > pageHeight - 10) {
          pdf.addPage();
          yPosition = 15;
        }

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error("Could not capture chart:", error);
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 7,
        { align: "center" }
      );
      pdf.text("TradingDash © 2025", 15, pageHeight - 7);
    }

    // Save PDF
    const filename = `trading-${data.asset}-${new Date(data.timestamp).toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
}
