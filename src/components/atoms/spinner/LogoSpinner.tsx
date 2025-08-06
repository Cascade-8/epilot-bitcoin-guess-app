import React from 'react'
import Image from 'next/image'

const LogoSpinner: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-indigo-900 bg-opacity-50 z-50">
    <div className="w-24 h-24 animate-spin">
      <Image
        src="/cascade.png"
        alt="Loading…"
        width={96}
        height={96}
        className="object-contain"
      />
    </div>
  </div>
)
const PageSpinner = () => {
  return <div className={'fixed w-screen h-screen flex justify-center items-center z-50'}><LogoSpinner/></div>
}
export { LogoSpinner, PageSpinner }