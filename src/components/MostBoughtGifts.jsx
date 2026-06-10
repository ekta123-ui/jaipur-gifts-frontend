import React, { useEffect, useState } from 'react';
import { homepageService, orderService } from '../api';
import { getPrice } from '../formatters';
import { toast } from 'react-toastify'; // Assuming you have react-toastify for notifications

const MostBoughtGifts = () => {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGifts = async () => {
            try {
                setLoading(true);
                const response = await homepageService.fetchMostBoughtGifts(8); // Fetch top 8 gifts
                // The API returns an array of { totalQuantity, gift: GiftObject }
                setGifts(response.gifts.map(item => item.gift));
            } catch (err) {
                console.error("Failed to fetch most bought gifts:", err);
                setError("Failed to load popular gifts. Please try again later.");
                toast.error("Failed to load popular gifts.");
            } finally {
                setLoading(false);
            }
        };

        fetchGifts();
    }, []);

    const handleCustomize = (gift) => {
        // Navigate to the customization form for this specific gift
        // This replaces the old WhatsApp redirect flow
        window.location.href = `/customize/${gift.giftId}`;
    };

    if (loading) {
        return <div className="text-center py-8">Loading popular gifts...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    if (gifts.length === 0) {
        return <div className="text-center py-8 text-gray-500">No popular gifts to display yet.</div>;
    }

    return (
        <section className="py-8">
            <h2 className="text-3xl font-bold text-center mb-8">Most Bought Gifts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {gifts.map((gift) => (
                    <div key={gift.giftId} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <img src={gift.imgUrl} alt={gift.name} className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-semibold mb-2">{gift.name}</h3>
                            <p className="text-gray-700 mb-2">{gift.description}</p>
                            <p className="text-lg font-bold text-indigo-600 mb-4">{getPrice(gift.price)}</p>
                            <button
                                onClick={() => handleCustomize(gift)}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300"
                            >
                                Customize Gift
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default MostBoughtGifts;