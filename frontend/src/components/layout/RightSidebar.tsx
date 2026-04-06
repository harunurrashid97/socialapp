'use client'
import Link from 'next/link'

export default function RightSidebar() {
  const friends = [
    { name: 'Steve Jobs', role: 'CEO of Apple', img: 'people1.png', time: '10 min ago' },
    { name: 'Ryan Roslansky', role: 'CEO of Linkedin', img: 'people2.png', time: 'Online' },
    { name: 'Dylan Field', role: 'CEO of Figma', img: 'people3.png', time: 'Online' },
    { name: 'Jeff Bezos', role: 'Founder of Amazon', img: 'people1.png', time: '2 hour ago' },
  ]

  return (
    <div className="_layout_right_sidebar_wrap">
      {/* Suggested Groups */}
      <div className="_layout_right_sidebar_inner">
        <div className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_right_inner_area_info_content _mar_b24">
            <h4 className="_right_inner_area_info_content_title _title5">You Might Like</h4>
            <span className="_right_inner_area_info_content_txt">
              <Link className="_right_inner_area_info_content_txt_link" href="#0">See All</Link>
            </span>
          </div>
          
          <div className="_right_inner_area_info_box">
            <div className="_right_inner_area_info_image">
              <img src="/assets/images/people3.png" alt="Image" className="_ppl_img" />
            </div>
            <div className="_right_inner_area_info_box_txt">
              <h4 className="_right_inner_area_info_box_title">Radovan SkillArena</h4>
              <p className="_right_inner_area_info_box_para">Founder & CEO at Trophy</p>
            </div>
          </div>
          <div className="_right_info_btn_grp">
            <Link href="#0" className="_right_info_btn_link">Ignore</Link>
            <Link href="#0" className="_right_info_btn_link _right_info_btn_link_active">Follow</Link>
          </div>
        </div>
      </div>

      {/* Your Friends */}
      <div className="_layout_right_sidebar_inner">
        <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_feed_right_inner_area_card_content _mar_b24">
            <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
            <span className="_feed_right_inner_area_card_content_txt">
              <Link className="_feed_right_inner_area_card_content_txt_link" href="#0">See All</Link>
            </span>
          </div>
          <form className="_feed_right_inner_area_card_form">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 17 17">
              <circle cx="7" cy="7" r="6" stroke="#666" />
              <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3" />
            </svg>
            <input className="form-control me-2 _feed_right_inner_area_card_form_inpt" type="search" placeholder="Search friends..." />
          </form>
          
          {friends.map((friend, i) => (
            <div className={`_feed_right_inner_area_card_ppl${friend.time.includes('ago') ? ' _feed_right_inner_area_card_ppl_inactive' : ''}`} key={i}>
              <div className="_feed_right_inner_area_card_ppl_box">
                <div className="_feed_right_inner_area_card_ppl_image">
                  <img src={`/assets/images/${friend.img}`} alt="Image" className="_box_ppl_img" />
                </div>
                <div className="_feed_right_inner_area_card_ppl_txt">
                  <h4 className="_feed_right_inner_area_card_ppl_title">{friend.name}</h4>
                  <p className="_feed_right_inner_area_card_ppl_para">{friend.role}</p>
                </div>
              </div>
              <div className="_feed_right_inner_area_card_ppl_side">
                <p className="_feed_right_inner_area_card_ppl_side_para">{friend.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
