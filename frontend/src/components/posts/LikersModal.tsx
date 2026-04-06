'use client'
import { initials } from '@/lib/utils'

interface Liker { id: string; full_name: string; email: string }
interface Props { likers: Liker[]; title: string; onClose: () => void }

export default function LikersModal({ likers, title, onClose }: Props) {
  return (
    <div className="_likers_modal_overlay" onClick={onClose}>
      <div className="_likers_modal" onClick={(e) => e.stopPropagation()}>
        <div className="_likers_modal_header">
          <span>{title}</span>
          <button className="_likers_modal_close" onClick={onClose}>×</button>
        </div>
        <div className="_likers_modal_body">
          {likers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '16px 0', fontSize: 13 }}>No likes yet</p>
          ) : (
            likers.map((l) => (
              <div key={l.id} className="_liker_item">
                <div className="_avatar_placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
                  {initials(l.full_name || 'U')}
                </div>
                <div>
                  <div className="_liker_name">{l.full_name}</div>
                  <div className="_liker_email">{l.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
