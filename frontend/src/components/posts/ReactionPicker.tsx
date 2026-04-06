'use client'
import React from 'react'

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void
}

const reactions: { type: ReactionType; label: string; color: string; icon: React.ReactNode }[] = [
  {
    type: 'like',
    label: 'Like',
    color: '#377DFF',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#377DFF" viewBox="0 0 24 24">
        <path d="M4 21h1V8H4a2 2 0 00-2 2v9a2 2 0 002 2zM20 8h-7l1.122-3.368A2 2 0 0012.225 2H12L7 8v13h9c1.35 0 2.53-.9 2.89-2.2l1.64-5.94A2 2 0 0018.6 10H15l1-4-1-1-5 5H7"/>
      </svg>
    )
  },
  {
    type: 'love',
    label: 'Love',
    color: '#F33E58',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#F33E58" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    )
  },
  {
    type: 'haha',
    label: 'Haha',
    color: '#FFCC4D',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 19 19">
        <path fill="#FFCC4D" d="M9.5 19a9.5 9.5 0 100-19 9.5 9.5 0 000 19z"/>
        <path fill="#664500" d="M9.5 11.083c-1.912 0-3.181-.222-4.75-.527-.358-.07-1.056 0-1.056 1.055 0 2.111 2.425 4.75 5.806 4.75 3.38 0 5.805-2.639 5.805-4.75 0-1.055-.697-1.125-1.055-1.055-1.57.305-2.838.527-4.75.527z"/>
        <path fill="#fff" d="M4.75 11.611s1.583.528 4.75.528 4.75-.528 4.75-.528-1.056 2.111-4.75 2.111-4.75-2.11-4.75-2.11z"/>
        <path fill="#664500" d="M6.333 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847zM12.667 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847z"/>
      </svg>
    )
  },
  {
    type: 'wow',
    label: 'Wow',
    color: '#FFCC4D',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#FFCC4D"/>
        <ellipse cx="8" cy="9" rx="2" ry="3" fill="#664500"/>
        <ellipse cx="16" cy="9" rx="2" ry="3" fill="#664500"/>
        <circle cx="12" cy="17" r="4" fill="#664500"/>
      </svg>
    )
  },
  {
    type: 'sad',
    label: 'Sad',
    color: '#FFCC4D',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#FFCC4D"/>
        <circle cx="8" cy="10" r="1.5" fill="#664500"/>
        <circle cx="16" cy="10" r="1.5" fill="#664500"/>
        <path d="M8 18c2-2 6-2 8 0" stroke="#664500" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M16 11c0 2-1 4-1 4" stroke="#377DFF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    type: 'angry',
    label: 'Angry',
    color: '#F33E58',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#F33E58"/>
        <path d="M6 10l4 2m8-2l-4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="8" cy="14" r="1.5" fill="#fff"/>
        <circle cx="16" cy="14" r="1.5" fill="#fff"/>
        <path d="M8 19c2-1 6-1 8 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    )
  }
]

export default function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <div className="_reaction_picker_wrap">
      <div className="_reaction_picker_inner">
        {reactions.map((react) => (
          <button
            key={react.type}
            className="_reaction_picker_btn"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(react.type)
            }}
            title={react.label}
          >
            <div className="_reaction_picker_icon">{react.icon}</div>
            <span className="_reaction_picker_label">{react.label}</span>
          </button>
        ))}
      </div>
      <style jsx>{`
        ._reaction_picker_wrap {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: white;
          border-radius: 30px;
          padding: 8px 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 1000;
          animation: slideUp 0.2s ease-out;
          padding-bottom: 20px; /* Bridge the gap to the button */
        }
        ._reaction_picker_inner {
          display: flex;
          gap: 12px;
        }
        ._reaction_picker_btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        ._reaction_picker_btn:hover {
          transform: scale(1.3) translateY(-5px);
        }
        ._reaction_picker_icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        ._reaction_picker_label {
          position: absolute;
          bottom: 100%;
          background: rgba(0,0,0,0.8);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          display: none;
          white-space: nowrap;
          margin-bottom: 5px;
        }
        ._reaction_picker_btn:hover ._reaction_picker_label {
          display: block;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
