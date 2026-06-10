import { HiCheckCircle, HiOutlineCube } from 'react-icons/hi';

const steps = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered'];

const OrderTimeline = ({ status }) => {
    const currentStepIndex = status === 'cancelled' ? -1 : steps.indexOf(status);

    if (status === 'cancelled') {
        return (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold">
                This order has been cancelled.
            </div>
        );
    }

    return (
        <div className="relative flex justify-between py-4">
            <div className="absolute top-8 left-0 w-full h-1 bg-gray-100 z-0 rounded-full" />
            <div
                className="absolute top-8 left-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 z-0 transition-all duration-1000 rounded-full"
                style={{ width: `${Math.max(0, currentStepIndex) / (steps.length - 1) * 100}%` }}
            />
            {steps.map((step, idx) => (
                <div key={step} className="relative z-10 flex flex-col items-center w-16">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 ${idx <= currentStepIndex ? 'bg-orange-500 text-white' : 'bg-white text-gray-300'}`}>
                        {idx < currentStepIndex ? <HiCheckCircle size={20} /> : <HiOutlineCube size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 uppercase text-center transition-colors ${idx <= currentStepIndex ? 'text-orange-600' : 'text-gray-300'}`}>
                        {step}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default OrderTimeline;
