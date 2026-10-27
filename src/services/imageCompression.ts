/**
 * Dịch vụ nén ảnh phía client (Client-side Image Compression)
 * Tối ưu đặc biệt cho điện thoại chụp ảnh độ phân giải cao tại xưởng sản xuất:
 * - Cạnh dài tối đa 1600px
 * - Chuyển sang định dạng JPEG chất lượng ~0.8
 * - Đảm bảo dung lượng mục tiêu < 1.5 MB
 */

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.8
): Promise<CompressedImageResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    // Đọc ảnh bằng FileReader hoặc URL.createObjectURL
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Tính tỉ lệ thu nhỏ nếu vượt quá maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Tạo canvas để nén
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Không thể khởi tạo Canvas 2D context'));
        return;
      }

      // Vẽ ảnh lên canvas với nền trắng (tránh nền đen cho ảnh PNG trong suốt)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Xuất sang JPEG
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Nén ảnh thất bại'));
            return;
          }

          const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], cleanFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          resolve({
            file: compressedFile,
            dataUrl,
            originalSize,
            compressedSize: blob.size,
            width,
            height,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể tải hoặc giải mã tệp hình ảnh'));
    };

    img.src = objectUrl;
  });
}

/**
 * Định dạng dung lượng byte ra KB / MB dễ nhìn
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Chuyển số tiền VNĐ sang định dạng phân cách hàng nghìn (VD: 15.000.000 ₫)
 */
export function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
