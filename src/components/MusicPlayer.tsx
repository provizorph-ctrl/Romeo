import { useState } from 'react';
import { Pause, Play, Volume2, VolumeX, Music } from 'lucide-react';
import { INVITATION_CONFIG } from '../config/invitationConfig';
import { getOrInitSession, trackEvent } from '../utils/tracking';

interface MusicPlayerProps {
  audioAvailable: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (val: number) => void;
}

export function MusicPlayer({
  audioAvailable,
  isPlaying,
  isMuted,
  volume,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
}: MusicPlayerProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        data-track={isPlaying ? 'Музыка: Пауза' : 'Музыка: Включить'}
        onClick={() => {
          if (!audioAvailable) {
            setShowDetails((prev) => !prev);
            return;
          }
          onTogglePlay();
        }}
        aria-label={
          !audioAvailable
            ? `Музыкальный плеер: ${INVITATION_CONFIG.music.title} (аудиофайл не добавлен)`
            : isPlaying
              ? `Пауза: ${INVITATION_CONFIG.music.title}`
              : `Включить музыку: ${INVITATION_CONFIG.music.title}`
        }
        className="min-h-[44px] px-3 py-2 rounded-full bg-[#F8EEE8]/90 hover:bg-[#F4D9DA]/50 border border-[#D8BD91]/40 text-[#725A55] flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
      >
        <span className="flex items-center justify-center w-5 h-5 text-[#98636F]">
          {isPlaying && audioAvailable ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </span>

        {/* Анимированный музыкальный индикатор */}
        <span className="flex items-end gap-[2px] h-3.5 w-4" aria-hidden="true">
          <span
            className={`w-[3px] rounded-full bg-[#98636F] transition-all duration-300 ${
              isPlaying && audioAvailable ? 'h-3.5 animate-pulse' : 'h-1.5 opacity-45'
            }`}
          />
          <span
            className={`w-[3px] rounded-full bg-[#D9A0A6] transition-all duration-300 ${
              isPlaying && audioAvailable ? 'h-2.5 animate-pulse' : 'h-2.5 opacity-45'
            }`}
          />
          <span
            className={`w-[3px] rounded-full bg-[#98636F] transition-all duration-300 ${
              isPlaying && audioAvailable ? 'h-3 animate-pulse' : 'h-1 opacity-45'
            }`}
          />
        </span>

        <span className="hidden sm:inline text-xs font-medium tracking-tight text-[#4A3835] max-w-[165px] truncate whitespace-nowrap">
          {INVITATION_CONFIG.music.title}
        </span>
      </button>

      {audioAvailable && (
        <button
          type="button"
          data-track="Музыка: Настройки громкости"
          onClick={() => setShowDetails((prev) => !prev)}
          aria-label="Настройки звука и громкости"
          aria-expanded={showDetails}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[#F8EEE8]/90 hover:bg-[#F4D9DA]/50 border border-[#D8BD91]/40 text-[#725A55] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-[#98636F]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#725A55]" />
          )}
        </button>
      )}

      {showDetails && (
        <div
          role="dialog"
          aria-label="Управление музыкой"
          className="absolute right-0 top-13 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#FFF9F4] border border-[#D8BD91]/50 shadow-[0_14px_32px_rgba(74,56,53,0.12)] p-4 text-left"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F4D9DA]/60 flex items-center justify-center shrink-0 text-[#98636F]">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#4A3835] truncate">
                {INVITATION_CONFIG.music.title}
              </p>
              <p className="text-xs text-[#725A55]">
                {INVITATION_CONFIG.music.artist}
              </p>
            </div>
          </div>

          {audioAvailable ? (
            <div className="mt-3 pt-3 border-t border-[#D8BD91]/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="music-volume-slider" className="text-xs text-[#725A55]">
                  Громкость
                </label>
                <button
                  type="button"
                  data-track={isMuted ? 'Музыка: Включить звук' : 'Музыка: Без звука'}
                  onClick={onToggleMute}
                  className="text-xs font-medium text-[#98636F] hover:underline"
                >
                  {isMuted ? 'Включить звук' : 'Без звука'}
                </button>
              </div>
              <input
                id="music-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                onPointerUp={(e) => {
                  const pct = Math.round(Number((e.target as HTMLInputElement).value) * 100);
                  trackEvent('button_click', {
                    buttonName: `Ползунок громкости: ${pct}%`,
                    screen: getOrInitSession().currentScreen,
                  });
                }}
                className="w-full accent-[#98636F] cursor-pointer"
              />
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-[#D8BD91]/30 text-xs text-[#725A55] leading-relaxed">
              <p>
                Аудиофайл <code className="text-[#98636F]">/public/music.mp3</code> пока не загружен.
              </p>
              <p className="mt-1 opacity-85">
                Добавьте файл композиции в проект, чтобы музыка зазвучала при открытии письма.
              </p>
            </div>
          )}

          <button
            type="button"
            data-track="Музыка: Закрыть настройки"
            onClick={() => setShowDetails(false)}
            className="mt-3 w-full min-h-[38px] rounded-xl bg-[#F8EEE8] hover:bg-[#F4D9DA]/50 text-xs font-medium text-[#4A3835] transition-colors"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}
