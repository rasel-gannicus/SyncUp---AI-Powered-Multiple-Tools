import Banner from '@/Components/Home Page/Banner';
import HomePage from '@/Components/Home Page/HomePage';
import { Analytics } from '@vercel/analytics/react';
import { useState } from 'react';

export default function Home() {

  return (
    <div className="grid  items-center justify-items-center min-h-[60vh] pb-20  ">
      <Banner />
      <HomePage /> 

      <Analytics />
    </div>
  );
}
