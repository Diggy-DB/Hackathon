import React from 'react';

export default function SceneTimeline(){
  const items = new Array(6).fill(0).map((_,i)=>({id:i+1,title:`Seg ${i+1}`,time:`0:${(i+1)*10}`}))
  return (
    <div className="bg-surface rounded-lg p-4">
      <h3 className="font-semibold mb-3">Timeline</h3>
      <div className="flex gap-3 overflow-x-auto">
        {items.map(it=> (
          <div key={it.id} className="w-40 flex-shrink-0 bg-gradient-to-b from-black/10 to-transparent rounded p-2">
            <div className="h-20 bg-gray-700 rounded mb-2" />
            <div className="text-sm font-medium">{it.title}</div>
            <div className="text-xs text-gray-400">{it.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
