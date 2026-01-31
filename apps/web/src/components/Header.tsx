import React from 'react';
import ThemeSwitch from './ThemeSwitch';

export default function Header(){
  return (
    <header className="site-header py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magenta to-cyan flex items-center justify-center font-bold text-black">SF</div>
          <div>
            <div className="text-lg font-semibold">StoryForge</div>
            <div className="text-xs text-gray-400">Cinematic · Anime · Collaborative</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-300">
            <a className="hover:underline" href="#">Home</a>
            <a className="hover:underline" href="#">Scenes</a>
            <a className="hover:underline" href="#">Bible</a>
          </nav>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
