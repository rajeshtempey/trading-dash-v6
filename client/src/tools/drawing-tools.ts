// client/src/tools/drawing-tools.ts
// 100% FREE Drawing Tools System - Uses Canvas API

export interface Point {
  x: number;
  y: number;
  price: number;
  timestamp?: number;
}

export interface DrawingObject {
  id: string;
  type: DrawingType;
  points: Point[];
  color: string;
  width: number;
  created: number;
  visible: boolean;
}

export type DrawingType = 
  | 'TRENDLINE'
  | 'HORIZONTAL_LINE'
  | 'VERTICAL_LINE'
  | 'RAY'
  | 'EXTENDED_LINE'
  | 'ARROW'
  | 'PARALLEL_CHANNEL'
  | 'REGRESSION_TREND'
  | 'PITCHFORK'
  | 'GANN_FAN';

export class DrawingToolsManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drawings: Map<string, DrawingObject> = new Map();
  private selectedDrawing: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  // ============ Trend Line Tool ============
  drawTrendLine(startPoint: Point, endPoint: Point, color: string = '#2962FF'): DrawingObject {
    const id = this.generateId();
    const drawing: DrawingObject = {
      id,
      type: 'TRENDLINE',
      points: [startPoint, endPoint],
      color,
      width: 2,
      created: Date.now(),
      visible: true
    };

    this.drawings.set(id, drawing);
    this.renderTrendLine(drawing);
    return drawing;
  }

  private renderTrendLine(drawing: DrawingObject): void {
    const [start, end] = drawing.points;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = drawing.color;
    this.ctx.lineWidth = drawing.width;
    this.ctx.stroke();

    // Price labels
    this.ctx.fillStyle = drawing.color;
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`$${start.price.toFixed(2)}`, start.x + 5, start.y - 5);
    this.ctx.fillText(`$${end.price.toFixed(2)}`, end.x + 5, end.y - 5);
  }

  // ============ Horizontal Line ============
  drawHorizontalLine(point: Point, color: string = '#FF6B6B'): DrawingObject {
    const id = this.generateId();
    const drawing: DrawingObject = {
      id,
      type: 'HORIZONTAL_LINE',
      points: [point],
      color,
      width: 2,
      created: Date.now(),
      visible: true
    };

    this.drawings.set(id, drawing);
    this.renderHorizontalLine(drawing);
    return drawing;
  }

  private renderHorizontalLine(drawing: DrawingObject): void {
    const point = drawing.points[0];

    this.ctx.beginPath();
    this.ctx.moveTo(0, point.y);
    this.ctx.lineTo(this.canvas.width, point.y);
    this.ctx.strokeStyle = drawing.color;
    this.ctx.lineWidth = drawing.width;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = drawing.color;
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`$${point.price.toFixed(2)}`, 10, point.y - 5);
  }

  // ============ Vertical Line ============
  drawVerticalLine(point: Point, color: string = '#4ECDC4'): DrawingObject {
    const id = this.generateId();
    const drawing: DrawingObject = {
      id,
      type: 'VERTICAL_LINE',
      points: [point],
      color,
      width: 2,
      created: Date.now(),
      visible: true
    };

    this.drawings.set(id, drawing);
    this.renderVerticalLine(drawing);
    return drawing;
  }

  private renderVerticalLine(drawing: DrawingObject): void {
    const point = drawing.points[0];

    this.ctx.beginPath();
    this.ctx.moveTo(point.x, 0);
    this.ctx.lineTo(point.x, this.canvas.height);
    this.ctx.strokeStyle = drawing.color;
    this.ctx.lineWidth = drawing.width;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  // ============ Ray (Line extending in one direction) ============
  drawRay(startPoint: Point, endPoint: Point, color: string = '#95E1D3'): DrawingObject {
    const id = this.generateId();
    const drawing: DrawingObject = {
      id,
      type: 'RAY',
      points: [startPoint, endPoint],
      color,
      width: 2,
      created: Date.now(),
      visible: true
    };

    this.drawings.set(id, drawing);
    this.renderRay(drawing);
    return drawing;
  }

  private renderRay(drawing: DrawingObject): void {
    const [start, end] = drawing.points;

    // Calculate direction
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Extend the line beyond canvas
    const scale = Math.max(this.canvas.width, this.canvas.height);
    const extendedX = start.x + (dx / Math.sqrt(dx * dx + dy * dy)) * scale;
    const extendedY = start.y + (dy / Math.sqrt(dx * dx + dy * dy)) * scale;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(extendedX, extendedY);
    this.ctx.strokeStyle = drawing.color;
    this.ctx.lineWidth = drawing.width;
    this.ctx.stroke();

    // Arrow head
    this.drawArrowHead(extendedX, extendedY, Math.atan2(extendedY - start.y, extendedX - start.x));
  }

  // ============ Arrow ============
  drawArrow(startPoint: Point, endPoint: Point, color: string = '#FFE66D'): DrawingObject {
    const id = this.generateId();
    const drawing: DrawingObject = {
      id,
      type: 'ARROW',
      points: [startPoint, endPoint],
      color,
      width: 2,
      created: Date.now(),
      visible: true
    };

    this.drawings.set(id, drawing);
    this.renderArrow(drawing);
    return drawing;
  }

  private renderArrow(drawing: DrawingObject): void {
    const [start, end] = drawing.points;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = drawing.color;
    this.ctx.lineWidth = drawing.width;
    this.ctx.stroke();

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    this.drawArrowHead(end.x, end.y, angle);
  }

  private drawArrowHead(x: number, y: number, angle: number): void {
    const headlen = 15;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.stroke();
  }

  // ============ Parallel Channel ============
  drawParallelChannel(point1: Point, point2: Point, point3: Point, color: string = '#A8E6CF'): DrawingObject {
    const id = this.generateId();
    const drawing: DrawingObject = {
      id,
      type: 'PARALLEL_CHANNEL',
      points: [point1, point2, point3],
      color,
      width: 2,
      created: Date.now(),
      visible: true
    };

    this.drawings.set(id, drawing);
    this.renderParallelChannel(drawing);
    return drawing;
  }

  private renderParallelChannel(drawing: DrawingObject): void {
    const [p1, p2, p3] = drawing.points;

    // First trend line
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.strokeStyle = drawing.color;
    this.ctx.lineWidth = drawing.width;
    this.ctx.stroke();

    // Calculate parallel line slope
    const slope = (p2.y - p1.y) / (p2.x - p1.x);
    const p4X = p3.x + (p2.x - p1.x);
    const p4Y = p3.y + (p2.y - p1.y);

    // Second trend line (parallel)
    this.ctx.beginPath();
    this.ctx.moveTo(p3.x, p3.y);
    this.ctx.lineTo(p4X, p4Y);
    this.ctx.stroke();

    // Fill channel
    this.ctx.fillStyle = drawing.color + '22';
    this.ctx.fillRect(Math.min(p1.x, p3.x), Math.min(p1.y, p3.y), 
                      Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
  }

  // ============ Utility Methods ============
  private generateId(): string {
    return `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  removeDrawing(id: string): void {
    this.drawings.delete(id);
  }

  updateDrawing(id: string, updates: Partial<DrawingObject>): void {
    const drawing = this.drawings.get(id);
    if (drawing) {
      Object.assign(drawing, updates);
    }
  }

  getDrawings(): DrawingObject[] {
    return Array.from(this.drawings.values()).filter(d => d.visible);
  }

  clearAll(): void {
    this.drawings.clear();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  redrawAll(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawings.forEach((drawing) => {
      if (!drawing.visible) return;

      switch (drawing.type) {
        case 'TRENDLINE':
          this.renderTrendLine(drawing);
          break;
        case 'HORIZONTAL_LINE':
          this.renderHorizontalLine(drawing);
          break;
        case 'VERTICAL_LINE':
          this.renderVerticalLine(drawing);
          break;
        case 'RAY':
          this.renderRay(drawing);
          break;
        case 'ARROW':
          this.renderArrow(drawing);
          break;
        case 'PARALLEL_CHANNEL':
          this.renderParallelChannel(drawing);
          break;
      }
    });
  }
}

export default DrawingToolsManager;
