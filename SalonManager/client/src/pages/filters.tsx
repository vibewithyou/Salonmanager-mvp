import React, { useState } from 'react';
import { useLocation } from 'wouter';

// Simple static page based on provided HTML design with basic filtering state
export default function FiltersPage() {
  const [, navigate] = useLocation();
  const services = ['Haircut', 'Coloring', 'Manicure', 'Pedicure', 'Facial'];
  const ratings = ['4 stars & up', '3 stars & up', '2 stars & up', '1 star & up'];

  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [rating, setRating] = useState('');

  function toggleService(name: string) {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedServices.length) params.set('services', selectedServices.join(','));
    if (rating) params.set('rating', rating);
    navigate(`/salons?${params.toString()}`);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#181611] overflow-x-hidden">
      {/* Map background */}
      <div
        className="flex-1 bg-cover bg-center p-4"
        style={{
          backgroundImage:
            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB6pi8RBRbJxPij8HNIo4DMmIYJdHSkiWobA4Mm4GUW7Ib-cfUr5v8SPnMkYLjIwb-wnXDE-xlxDZ-Pq5Pj0_jIvHJ-N_gu-2aUpn68Iyw_0TrPooQvpSQObmZCgrb4i9pRBN8a_kqVPLVhFVyFkMluhPeLcduK0tjYwb9nuR-RvwYhYGLJw1IgwiWVvgUwvv8QTHGU2ih-XV9ElkXJIkmLdmJVH75WdczjZEkUPPoxSzbv5ZNTwfPuMneGx5wFYHv-hlJAs4U-zPHv")',
        }}
      >
        <div className="max-w-xl">
          <div className="flex items-center rounded-lg overflow-hidden bg-[#26241c]">
            <div className="p-3 text-[#b8b29d]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input
              placeholder="Search for a salon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-[#26241c] text-white px-2 py-3 placeholder:text-[#b8b29d] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 bg-[#181611]">
        <div className="h-5 flex items-center justify-center">
          <div className="h-1 w-9 rounded-full bg-[#534d3c]"></div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <h3 className="text-white text-lg font-bold px-4 pb-2 pt-4">Filters</h3>
          {/* Price slider (static visual) */}
          <div className="p-4">
            <p className="text-white text-base font-medium pb-3">Price</p>
            <div className="flex h-1 w-full rounded-sm bg-[#534d3c]">
              <div className="flex-1 bg-white"></div>
            </div>
          </div>
          {/* Distance slider */}
          <div className="p-4">
            <div className="flex justify-between">
              <p className="text-white font-medium">Distance</p>
              <p className="text-white text-sm">5 mi</p>
            </div>
            <div className="mt-2 flex h-4 items-center gap-4">
              <div className="flex h-1 flex-1 rounded-sm bg-[#534d3c]">
                <div className="h-full w-[32%] rounded-sm bg-white"></div>
                <div className="relative">
                  <div className="absolute -left-2 -top-1.5 size-4 rounded-full bg-white" />
                </div>
              </div>
              <p className="text-white text-sm">5 mi</p>
            </div>
          </div>
          {/* Services */}
          <h3 className="text-white text-lg font-bold px-4 pb-2 pt-4">Services</h3>
          <div className="px-4">
            {services.map((svc) => (
              <label key={svc} className="flex gap-x-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(svc)}
                  onChange={() => toggleService(svc)}
                  className="h-5 w-5 rounded border-2 border-[#534d3c] bg-transparent text-[#e6b319] focus:ring-0"
                />
                <p className="text-white text-base">{svc}</p>
              </label>
            ))}
          </div>
          {/* Rating */}
          <h3 className="text-white text-lg font-bold px-4 pb-2 pt-4">Rating</h3>
          <div className="flex flex-wrap gap-3 p-4">
            {ratings.map((r) => (
              <label
                key={r}
                className={`text-sm font-medium flex items-center justify-center rounded-lg border px-4 h-11 cursor-pointer ${
                  rating === r ? 'border-[#e6b319]' : 'border-[#534d3c] text-white'
                }`}
              >
                {r}
                <input
                  type="radio"
                  className="invisible absolute"
                  name="rating"
                  checked={rating === r}
                  onChange={() => setRating(r)}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex px-4 py-3">
          <button
            onClick={applyFilters}
            className="flex-1 h-10 rounded-lg bg-[#e6b319] text-[#181611] text-sm font-bold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
