import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, X, QrCode, AlertCircle } from 'lucide-react';
import { INVITATION_CONFIG } from '../config/invitationConfig';
import { trackFieldFocus } from '../utils/tracking';

interface QRGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  publishedUrl: string;
}

export function QRGenerator({ isOpen, onClose, publishedUrl }: QRGeneratorProps) {
  const initialUrl =
    publishedUrl ||
    (typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
      ? window.location.origin
      : '');

  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');

  useEffect(() => {
    if (publishedUrl && !targetUrl) {
      setTargetUrl(publishedUrl);
    }
  }, [publishedUrl, targetUrl]);

  const effectiveUrl = targetUrl.trim();
  const isLocalhost = /localhost|127\.0\.0\.1/i.test(effectiveUrl);

  useEffect(() => {
    if (!isOpen) return;
    if (!effectiveUrl || !/^https?:\/\/.+/i.test(effectiveUrl)) {
      setQrDataUrl('');
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(effectiveUrl, {
      width: 520,
      margin: 2,
      color: {
        dark: '#4A3835',
        light: '#FFF9F4',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setQrError('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError('Не удалось сформировать QR-код для этой ссылки.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveUrl, isOpen]);

  if (!isOpen) return null;

  const handleDownloadPng = async () => {
    if (!qrDataUrl) return;
    const canvas = document.createElement('canvas');
    const width = 900;
    const height = 1180;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Фон кремовой открытки
    ctx.fillStyle = '#FFF9F4';
    ctx.fillRect(0, 0, width, height);

    // Внешняя и внутренняя рамка цвета шампань
    ctx.strokeStyle = '#D8BD91';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, width - 96, height - 96);

    ctx.strokeStyle = '#D9A0A6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(64, 64, width - 128, height - 128);

    // Заголовок открытки
    ctx.fillStyle = '#98636F';
    ctx.textAlign = 'center';
    ctx.font = 'italic 64px Georgia, serif';
    ctx.fillText(INVITATION_CONFIG.qrCard.title, width / 2, 185);

    // Подзаголовок
    ctx.fillStyle = '#725A55';
    ctx.font = '26px sans-serif';
    ctx.fillText('Отсканируй камерой телефона,', width / 2, 245);
    ctx.fillText('чтобы открыть маленькое письмо', width / 2, 282);

    // QR-код в центре
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 480;
      const qrX = (width - qrSize) / 2;
      const qrY = 355;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
      ctx.strokeStyle = '#D8BD91';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Подпись снизу
      ctx.fillStyle = '#98636F';
      ctx.font = 'italic 42px Georgia, serif';
      ctx.fillText(INVITATION_CONFIG.qrCard.footerNote, width / 2, 990);

      const link = document.createElement('a');
      link.download = 'bouquet-qr-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrDataUrl;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#4A3835]/45 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#FFF9F4] border border-[#D8BD91]/60 shadow-[0_24px_60px_rgba(74,56,53,0.18)] p-6 sm:p-8 my-auto">
        <button
          type="button"
          onClick={onClose}
          data-track="QR: Закрыть"
          aria-label="Закрыть генератор QR-кода"
          className="absolute right-4 top-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#725A55] hover:bg-[#F8EEE8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[#98636F] mb-2">
          <QrCode className="w-5 h-5" />
          <span className="text-xs font-medium tracking-widest uppercase">
            Карточка для букета
          </span>
        </div>

        <h2
          id="qr-modal-title"
          className="font-serif text-2xl sm:text-3xl font-medium text-[#4A3835]"
        >
          QR-код приглашения
        </h2>
        <p className="mt-1.5 text-sm text-[#725A55] leading-relaxed">
          Вставьте опубликованную ссылку на сайт, чтобы скачать или распечатать карточку к цветам.
        </p>

        <div className="mt-4">
          <label
            htmlFor="qr-url-input"
            className="block text-xs font-medium text-[#725A55] mb-1.5"
          >
            Ссылка для QR-кода (опубликованный адрес)
          </label>
          <input
            id="qr-url-input"
            type="url"
            value={targetUrl}
            onFocus={() => trackFieldFocus('qr_url', 'Ссылка для QR-кода')}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://your-published-invitation.app"
            className="w-full min-h-[44px] rounded-xl bg-[#F8EEE8]/70 border border-[#D8BD91]/50 px-3.5 py-2 text-base sm:text-sm text-[#4A3835] placeholder:text-[#725A55]/50 focus:outline-none focus:border-[#98636F]"
          />
          {isLocalhost && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#98636F]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Обнаружен localhost — замените ссылку на опубликованный URL перед печатью для букета.
              </span>
            </p>
          )}
          {!effectiveUrl && (
            <p className="mt-1.5 text-xs text-[#725A55]">
              Укажите публичный https:// адрес опубликованного сайта, чтобы сформировать QR-код.
            </p>
          )}
          {qrError && <p className="mt-1.5 text-xs text-[#98636F]">{qrError}</p>}
        </div>

        {/* Предпросмотр карточки для печати */}
        <div
          id="printable-qr-card"
          className="mt-5 mx-auto max-w-[300px] rounded-2xl bg-[#FFF9F4] border border-[#D8BD91] p-5 text-center shadow-[0_8px_24px_rgba(114,90,85,0.08)]"
        >
          <div className="border border-[#D9A0A6]/45 rounded-xl px-4 py-5">
            <p className="font-script text-3xl text-[#98636F]">
              {INVITATION_CONFIG.qrCard.title}
            </p>
            <p className="mt-1 text-xs text-[#725A55] leading-snug">
              {INVITATION_CONFIG.qrCard.subtitle}
            </p>

            <div className="mt-4 mx-auto w-44 h-44 rounded-xl bg-white border border-[#D8BD91]/50 p-2.5 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR-код для открытия письма от Бакытжана"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-[#725A55]/70 px-2">
                  Введите https:// ссылку выше
                </div>
              )}
            </div>

            <p className="mt-4 font-serif italic text-lg text-[#725A55]">
              {INVITATION_CONFIG.qrCard.footerNote}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={!qrDataUrl}
            data-track="QR: Скачать PNG"
            onClick={handleDownloadPng}
            className="flex-1 min-h-[46px] rounded-xl bg-[#98636F] hover:bg-[#82525D] disabled:opacity-45 disabled:cursor-not-allowed text-[#FFF9F4] text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Скачать PNG</span>
          </button>
          <button
            type="button"
            disabled={!qrDataUrl}
            data-track="QR: Распечатать карточку"
            onClick={() => window.print()}
            className="flex-1 min-h-[46px] rounded-xl bg-[#F8EEE8] hover:bg-[#F4D9DA]/60 disabled:opacity-45 disabled:cursor-not-allowed border border-[#D8BD91]/60 text-[#4A3835] text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Распечатать карточку</span>
          </button>
        </div>
      </div>
    </div>
  );
}
