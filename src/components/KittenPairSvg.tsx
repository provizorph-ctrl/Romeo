import { motion, useReducedMotion } from 'motion/react';

export type KittenMood = 'gentle' | 'hopeful' | 'celebrating' | 'shy';

interface KittenPairSvgProps {
  mood?: KittenMood;
  className?: string;
}

/**
 * Оригинальная векторная иллюстрация двух котят в едином стиле:
 * левый котенок держит небольшой букет цветов, правый — сердечко.
 */
export function KittenPairSvg({ mood = 'gentle', className = '' }: KittenPairSvgProps) {
  const prefersReduced = useReducedMotion();
  const isCelebrating = mood === 'celebrating';
  const isShy = mood === 'shy';
  const isHopeful = mood === 'hopeful';

  const bounceTransition = prefersReduced
    ? { duration: 0 }
    : isCelebrating
      ? { duration: 0.9, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const }
      : { duration: 2.8, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const };

  return (
    <div className={`relative select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 380 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_12px_24px_rgba(114,90,85,0.08)]"
      >
        <defs>
          <radialGradient id="kittenGlow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#F4D9DA" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#F8EEE8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFF9F4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ivoryFur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDFB" />
            <stop offset="100%" stopColor="#F4E6DD" />
          </linearGradient>
          <linearGradient id="caramelFur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8E7DB" />
            <stop offset="100%" stopColor="#E6C9B8" />
          </linearGradient>
        </defs>

        {/* Мягкое свечение на фоне */}
        <ellipse cx="190" cy="135" rx="168" ry="82" fill="url(#kittenGlow)" />

        {/* Тени под лапками */}
        <ellipse cx="122" cy="204" rx="54" ry="9" fill="#D9A0A6" fillOpacity="0.18" />
        <ellipse cx="256" cy="204" rx="54" ry="9" fill="#D9A0A6" fillOpacity="0.18" />

        {/* Плавающие сердечки над котятами */}
        <motion.g
          animate={
            prefersReduced
              ? undefined
              : {
                  y: isCelebrating ? [-4, -14, -4] : [0, -6, 0],
                  opacity: isCelebrating ? [0.8, 1, 0.8] : [0.55, 0.9, 0.55],
                }
          }
          transition={{ duration: isCelebrating ? 1.4 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M190 42 C190 36 182 33 178 38 C174 33 166 36 166 42 C166 50 178 57 178 57 C178 57 190 50 190 42 Z"
            fill="#D9A0A6"
          />
          {isCelebrating && (
            <>
              <path
                d="M138 28 C138 24 133 22 130 25 C127 22 122 24 122 28 C122 33 130 38 130 38 C130 38 138 33 138 28 Z"
                fill="#98636F"
                fillOpacity="0.75"
              />
              <path
                d="M254 30 C254 26 249 24 246 27 C243 24 238 26 238 30 C238 35 246 40 246 40 C246 40 254 35 254 30 Z"
                fill="#D8BD91"
              />
            </>
          )}
        </motion.g>

        {/* ================= ЛЕВЫЙ КОТЕНОК (С БУКЕТОМ) ================= */}
        <motion.g
          animate={
            prefersReduced
              ? undefined
              : {
                  y: isCelebrating ? [0, -7, 0] : [0, -2.5, 0],
                  rotate: isShy ? -2 : isHopeful ? 1.5 : 0,
                }
          }
          transition={bounceTransition}
          style={{ originX: '122px', originY: '195px' }}
        >
          {/* Хвостик */}
          <motion.path
            d="M78 186 C56 182 50 158 64 148 C72 142 78 150 74 158"
            stroke="#725A55"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            animate={prefersReduced ? undefined : { rotate: [-4, 4, -4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: '95% 95%' }}
          />

          {/* Тело */}
          <path
            d="M84 196 C82 154 96 136 122 136 C148 136 162 154 158 196 C157 201 149 203 122 203 C95 203 85 201 84 196 Z"
            fill="url(#ivoryFur)"
            stroke="#725A55"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Ушки */}
          <path
            d="M86 96 L80 62 C80 58 84 56 87 58 L108 77 Z"
            fill="url(#ivoryFur)"
            stroke="#725A55"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M88 89 L85 67 L102 80 Z" fill="#F4D9DA" />

          <path
            d="M158 96 L164 62 C164 58 160 56 157 58 L136 77 Z"
            fill="url(#ivoryFur)"
            stroke="#725A55"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M156 89 L159 67 L142 80 Z" fill="#F4D9DA" />

          {/* Голова */}
          <ellipse
            cx="122"
            cy="108"
            rx="44"
            ry="37"
            fill="url(#ivoryFur)"
            stroke="#725A55"
            strokeWidth="2.2"
          />

          {/* Легкие полоски на лбу */}
          <path d="M122 72 V80 M114 74 L116 81 M130 74 L128 81" stroke="#D8BD91" strokeWidth="2.2" strokeLinecap="round" />

          {/* Румянец */}
          <ellipse cx="97" cy="116" rx="7" ry="4" fill="#F4D9DA" fillOpacity={isShy ? 0.95 : 0.75} />
          <ellipse cx="147" cy="116" rx="7" ry="4" fill="#F4D9DA" fillOpacity={isShy ? 0.95 : 0.75} />

          {/* Глазки */}
          {isCelebrating ? (
            <>
              <path d="M100 107 Q105 101 110 107" stroke="#4A3835" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M134 107 Q139 101 144 107" stroke="#4A3835" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="105" cy="105" r="4.5" fill="#4A3835" />
              <circle cx="103.5" cy="103.3" r="1.5" fill="#FFF9F4" />
              <circle cx="139" cy="105" r="4.5" fill="#4A3835" />
              <circle cx="137.5" cy="103.3" r="1.5" fill="#FFF9F4" />
            </>
          )}

          {/* Носик и улыбка */}
          <path d="M119 112 L125 112 L122 115.5 Z" fill="#D9A0A6" />
          <path
            d="M115 118 Q119 122 122 117 Q125 122 129 118"
            stroke="#725A55"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />

          {/* Усики */}
          <path d="M84 111 L72 109 M84 117 L72 119" stroke="#725A55" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M160 111 L172 109 M160 117 L172 119" stroke="#725A55" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />

          {/* Мини-букет в лапках */}
          <g transform="translate(136, 144) rotate(8)">
            {/* Крафт-упаковка букета */}
            <path d="M8 22 L28 16 L19 46 L11 46 Z" fill="#EED9C4" stroke="#725A55" strokeWidth="1.7" strokeLinejoin="round" />
            {/* Ленточка */}
            <path d="M11 36 Q16 39 21 35" stroke="#98636F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            {/* Листики */}
            <ellipse cx="10" cy="14" rx="5" ry="9" transform="rotate(-25 10 14)" fill="#B6C4A2" stroke="#725A55" strokeWidth="1.3" />
            <ellipse cx="26" cy="14" rx="5" ry="9" transform="rotate(22 26 14)" fill="#B6C4A2" stroke="#725A55" strokeWidth="1.3" />
            {/* Розочки */}
            <circle cx="13" cy="13" r="6.5" fill="#F4D9DA" stroke="#725A55" strokeWidth="1.4" />
            <path d="M11 13 Q13 10 15 13" stroke="#98636F" strokeWidth="1.2" fill="none" />
            <circle cx="23" cy="11" r="6.5" fill="#D9A0A6" stroke="#725A55" strokeWidth="1.4" />
            <path d="M21 11 Q23 8 25 11" stroke="#FFF9F4" strokeWidth="1.2" fill="none" />
            <circle cx="18" cy="19" r="6" fill="#FFF2EC" stroke="#725A55" strokeWidth="1.4" />
          </g>

          {/* Лапки левого котенка */}
          <ellipse cx="106" cy="170" rx="9" ry="6.5" fill="#FFFDFB" stroke="#725A55" strokeWidth="2" />
          <ellipse cx="143" cy="169" rx="9" ry="6.5" fill="#FFFDFB" stroke="#725A55" strokeWidth="2" />
        </motion.g>

        {/* ================= ПРАВЫЙ КОТЕНОК (С СЕРДЕЧКОМ) ================= */}
        <motion.g
          animate={
            prefersReduced
              ? undefined
              : {
                  y: isCelebrating ? [0, -8, 0] : [0, -3, 0],
                  rotate: isShy ? 2.5 : isHopeful ? -1.5 : 0,
                }
          }
          transition={{
            ...bounceTransition,
            delay: prefersReduced ? 0 : 0.2,
          }}
          style={{ originX: '258px', originY: '195px' }}
        >
          {/* Хвостик */}
          <motion.path
            d="M302 186 C324 182 330 158 316 148 C308 142 302 150 306 158"
            stroke="#725A55"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            animate={prefersReduced ? undefined : { rotate: [4, -4, 4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: '5% 95%' }}
          />

          {/* Тело */}
          <path
            d="M220 196 C216 154 230 136 256 136 C282 136 296 154 294 196 C293 201 283 203 256 203 C229 203 221 201 220 196 Z"
            fill="url(#caramelFur)"
            stroke="#725A55"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Ушки */}
          <path
            d="M220 96 L214 62 C214 58 218 56 221 58 L242 77 Z"
            fill="url(#caramelFur)"
            stroke="#725A55"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M222 89 L219 67 L236 80 Z" fill="#F4D9DA" />

          <path
            d="M292 96 L298 62 C298 58 294 56 291 58 L270 77 Z"
            fill="url(#caramelFur)"
            stroke="#725A55"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M290 89 L293 67 L276 80 Z" fill="#F4D9DA" />

          {/* Голова */}
          <ellipse
            cx="256"
            cy="108"
            rx="44"
            ry="37"
            fill="url(#caramelFur)"
            stroke="#725A55"
            strokeWidth="2.2"
          />

          {/* Милый бантик у ушка */}
          <g transform="translate(278, 72) rotate(16)">
            <path d="M0 0 L-8 -5 L-8 5 Z" fill="#D9A0A6" stroke="#725A55" strokeWidth="1.4" />
            <path d="M0 0 L8 -5 L8 5 Z" fill="#D9A0A6" stroke="#725A55" strokeWidth="1.4" />
            <circle cx="0" cy="0" r="2.5" fill="#98636F" />
          </g>

          {/* Светлое пятнышко на мордочке */}
          <ellipse cx="256" cy="117" rx="18" ry="12" fill="#FFF9F4" fillOpacity="0.65" />

          {/* Румянец */}
          <ellipse cx="231" cy="116" rx="7" ry="4" fill="#D9A0A6" fillOpacity={isShy ? 0.85 : 0.55} />
          <ellipse cx="281" cy="116" rx="7" ry="4" fill="#D9A0A6" fillOpacity={isShy ? 0.85 : 0.55} />

          {/* Глазки */}
          {isCelebrating ? (
            <>
              <path d="M234 107 Q239 101 244 107" stroke="#4A3835" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M268 107 Q273 101 278 107" stroke="#4A3835" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="239" cy="105" r="4.5" fill="#4A3835" />
              <circle cx="237.5" cy="103.3" r="1.5" fill="#FFF9F4" />
              <circle cx="273" cy="105" r="4.5" fill="#4A3835" />
              <circle cx="271.5" cy="103.3" r="1.5" fill="#FFF9F4" />
            </>
          )}

          {/* Носик и улыбка */}
          <path d="M253 112 L259 112 L256 115.5 Z" fill="#98636F" />
          <path
            d="M249 118 Q253 122 256 117 Q259 122 263 118"
            stroke="#725A55"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />

          {/* Усики */}
          <path d="M218 111 L206 109 M218 117 L206 119" stroke="#725A55" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M294 111 L306 109 M294 117 L306 119" stroke="#725A55" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />

          {/* Сердечко в лапках правого котенка */}
          <g transform="translate(220, 152)">
            <motion.g
              animate={
                prefersReduced
                  ? undefined
                  : { scale: isCelebrating ? [1, 1.12, 1] : [1, 1.05, 1] }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <path
                d="M20 32 C20 32 4 21 4 11 C4 5.5 8.5 2 13.5 2 C16.7 2 19 3.8 20 6 C21 3.8 23.3 2 26.5 2 C31.5 2 36 5.5 36 11 C36 21 20 32 20 32 Z"
                fill="#D9A0A6"
                stroke="#725A55"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M11 8 C11 6.5 12.5 5.5 14 6"
                stroke="#FFF9F4"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </motion.g>
          </g>

          {/* Лапки правого котенка */}
          <ellipse cx="228" cy="171" rx="9" ry="6.5" fill="#F8E7DB" stroke="#725A55" strokeWidth="2" />
          <ellipse cx="255" cy="173" rx="9" ry="6.5" fill="#F8E7DB" stroke="#725A55" strokeWidth="2" />
        </motion.g>
      </svg>
    </div>
  );
}
