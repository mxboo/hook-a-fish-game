import { createPortal } from 'react-dom'

export default function GameTutorial() {
  return createPortal(
    <div className="fixed left-4 top-4 z-40">
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 min-w-[260px] border border-white/5 shadow-2xl">
        <div className="text-xl font-bold text-white mb-3 text-center">🎮 游戏玩法</div>
        
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-bold text-white text-xs mb-1">控制鱼竿</div>
              <div>移动鼠标控制鱼竿的方向和角度</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🪝</span>
            <div>
              <div className="font-bold text-white text-xs mb-1">瞄准鱼嘴</div>
              <div>当鱼跳出水面时，将鱼钩对准鱼嘴</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🐟</span>
            <div>
              <div className="font-bold text-white text-xs mb-1">钓起鱼</div>
              <div>成功钩住鱼后，将它放入桶中</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="font-bold text-white text-xs mb-1">时间挑战</div>
              <div>在 60 秒内钓到尽可能多的鱼！</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
