import React from 'react';

export default function SceneBibleCard(){
  return (
    <div className="bg-surface rounded-lg p-4">
      <h3 className="font-semibold mb-2">Scene Bible</h3>
      <div className="text-sm text-gray-300 mb-3">Version 5 · Last updated by seg_005</div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-600" />
          <div>
            <div className="font-medium">Maya Chen</div>
            <div className="text-xs text-gray-400">Protagonist · Determined</div>
          </div>
        </div>
        <div className="text-xs text-gray-400">Setting: Starship Horizon · Year 3042</div>
      </div>
      <div className="mt-4">
        <button className="px-3 py-2 bg-magenta text-white rounded">Continue Scene</button>
      </div>
    </div>
  )
}
