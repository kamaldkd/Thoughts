export function LotusMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 26C11 23 6.5 18.7 5 13.7C10.1 14.1 14.4 17.5 16 26Z"
        fill="currentColor"
        fillOpacity=".72"
        stroke="#F5D0FE"
        strokeOpacity=".8"
        strokeWidth="1"
      />
      <path
        d="M16 26C21 23 25.5 18.7 27 13.7C21.9 14.1 17.6 17.5 16 26Z"
        fill="currentColor"
        fillOpacity=".72"
        stroke="#F5D0FE"
        strokeOpacity=".8"
        strokeWidth="1"
      />
      <path
        d="M16 25.5C12.2 20.5 12.1 13.7 16 6C19.9 13.7 19.8 20.5 16 25.5Z"
        fill="currentColor"
        stroke="#FFF7FE"
        strokeWidth="1.2"
      />
      <path
        d="M16 25.5C13.2 21.3 13.1 15.7 14.2 11.5C17.1 15 18.1 20.5 16 25.5Z"
        fill="#F5D0FE"
        fillOpacity=".8"
      />
      <path
        d="M5.5 23C9.2 26.1 12.6 27.1 16 25.6C19.4 27.1 22.8 26.1 26.5 23C24.1 27.9 20.4 29.5 16 28.1C11.6 29.5 7.9 27.9 5.5 23Z"
        fill="currentColor"
        stroke="#F5D0FE"
        strokeOpacity=".8"
        strokeWidth=".8"
      />
    </svg>
  );
}

export function LotusBloom() {
  return (
    <div
      className="relative flex h-44 w-44 items-center justify-center animate-float sm:h-52 sm:w-52"
      aria-hidden="true"
    >
      <span className="absolute inset-5 rounded-full bg-fuchsia-400/20 blur-2xl dark:bg-violet-500/25" />
      <svg
        viewBox="0 0 360 270"
        preserveAspectRatio="xMidYMid slice"
        className="relative h-full w-full overflow-visible drop-shadow-[0_20px_24px_rgba(101,38,151,0.2)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="lotus-aura" cx="0" cy="0" r="1" gradientTransform="matrix(0 110 -155 0 180 152)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F0ABFC" stopOpacity=".42" />
            <stop offset="1" stopColor="#C084FC" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lotus-petal-back" x1="180" y1="45" x2="180" y2="218" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7FE" />
            <stop offset=".38" stopColor="#E879F9" />
            <stop offset="1" stopColor="#7E22CE" />
          </linearGradient>
          <linearGradient id="lotus-petal-side" x1="67" y1="105" x2="203" y2="224" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7FE" />
            <stop offset=".2" stopColor="#F0ABFC" />
            <stop offset=".48" stopColor="#C084FC" />
            <stop offset=".78" stopColor="#9333EA" />
            <stop offset="1" stopColor="#581C87" />
          </linearGradient>
          <linearGradient id="lotus-petal-center" x1="180" y1="28" x2="180" y2="222" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset=".16" stopColor="#FDF4FF" />
            <stop offset=".38" stopColor="#E879F9" />
            <stop offset=".72" stopColor="#C026D3" />
            <stop offset=".94" stopColor="#7E22CE" />
            <stop offset="1" stopColor="#581C87" />
          </linearGradient>
          <linearGradient id="lotus-petal-inner" x1="130" y1="110" x2="190" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7FE" />
            <stop offset=".45" stopColor="#F0ABFC" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="lotus-base" x1="95" y1="204" x2="265" y2="242" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C084FC" />
            <stop offset=".5" stopColor="#F5D0FE" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="lotus-heart" x1="180" y1="204" x2="180" y2="222" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7C2" />
            <stop offset=".52" stopColor="#F9A8D4" />
            <stop offset="1" stopColor="#C026D3" />
          </linearGradient>
          <filter id="lotus-glow" x="30" y="12" width="300" height="254" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="lotus-depth" x="35" y="15" width="290" height="250" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#3B0764" floodOpacity=".58" />
          </filter>
        </defs>

        <ellipse cx="180" cy="142" rx="148" ry="115" fill="url(#lotus-aura)" />
        <ellipse cx="180" cy="227" rx="92" ry="12" fill="#A855F7" fillOpacity=".25" filter="url(#lotus-glow)" />

        <g filter="url(#lotus-depth)">
        <g opacity=".82" stroke="#FFF7FE" strokeWidth="1.5">
          <path d="M180 218C141 185 119 127 134 76C164 103 178 156 180 218Z" fill="url(#lotus-petal-back)" fillOpacity=".82" />
          <path d="M180 218C219 185 241 127 226 76C196 103 182 156 180 218Z" fill="url(#lotus-petal-back)" fillOpacity=".82" />
        </g>

        <path d="M180 219C127 205 77 172 57 124C91 116 148 151 180 219Z" fill="url(#lotus-petal-side)" stroke="#FDF4FF" strokeOpacity=".52" strokeWidth="1.5" />
        <path d="M180 219C233 205 283 172 303 124C269 116 212 151 180 219Z" fill="url(#lotus-petal-side)" stroke="#FDF4FF" strokeOpacity=".52" strokeWidth="1.5" />

        <path d="M180 218C146 181 136 128 153 72C177 105 187 163 180 218Z" fill="url(#lotus-petal-inner)" stroke="white" strokeOpacity=".76" strokeWidth="2" />
        <path d="M180 218C214 181 224 128 207 72C183 105 173 163 180 218Z" fill="url(#lotus-petal-inner)" stroke="white" strokeOpacity=".76" strokeWidth="2" />

        <path d="M180 221C151 174 158 94 180 31C202 94 209 174 180 221Z" fill="url(#lotus-petal-center)" stroke="white" strokeOpacity=".95" strokeWidth="2.5" />

        <g fill="none" stroke="white" strokeLinecap="round">
          <path d="M69 132C108 132 149 166 171 205" strokeOpacity=".28" strokeWidth="4" />
          <path d="M291 132C252 132 211 166 189 205" strokeOpacity=".28" strokeWidth="4" />
          <path d="M161 92C169 123 172 164 178 208" strokeOpacity=".42" strokeWidth="2.5" />
          <path d="M199 92C191 123 188 164 182 208" strokeOpacity=".42" strokeWidth="2.5" />
          <path d="M180 53C178 104 179 162 180 208" strokeOpacity=".56" strokeWidth="3" />
          <path d="M170 69C164 109 167 161 177 197" strokeOpacity=".32" strokeWidth="6" />
          <path d="M190 69C196 109 193 161 183 197" strokeOpacity=".32" strokeWidth="6" />
        </g>

        <path d="M91 202C121 219 151 225 180 215C209 225 239 219 269 202C244 229 214 238 180 230C146 238 116 229 91 202Z" fill="url(#lotus-base)" stroke="#FDF4FF" strokeOpacity=".72" strokeWidth="1.5" />
        <path d="M115 207C139 218 161 220 180 214C199 220 221 218 245 207" stroke="white" strokeLinecap="round" strokeOpacity=".7" strokeWidth="2" />
        <ellipse cx="180" cy="210" rx="10" ry="5" fill="url(#lotus-heart)" stroke="#FFF7C2" strokeOpacity=".8" />
        <g fill="#FFF7C2" fillOpacity=".9">
          <circle cx="176" cy="209" r="1.1" />
          <circle cx="180" cy="207" r="1.1" />
          <circle cx="184" cy="209" r="1.1" />
        </g>
        </g>

        <g fill="#FFF7FE">
          <path d="M75 79L78 87L86 90L78 93L75 101L72 93L64 90L72 87L75 79Z" fillOpacity=".9" />
          <path d="M275 57L277 63L283 65L277 67L275 73L273 67L267 65L273 63L275 57Z" fillOpacity=".76" />
          <circle cx="103" cy="52" r="2.5" fillOpacity=".78" />
          <circle cx="257" cy="94" r="2" fillOpacity=".8" />
        </g>
      </svg>
    </div>
  );
}
