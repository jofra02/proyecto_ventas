import React, { useState } from 'react';
import { Plus, Layout } from 'lucide-react';

const CustomView = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-6">
                <Layout size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Build Your Custom View</h2>
            <p className="text-gray-500 max-w-md mb-8">
                Select widgets from the library to create a personalized dashboard tailored to your workflow.
            </p>
            <button className="primary-btn text-lg px-8 py-3">
                <Plus size={20} /> Add First Widget
            </button>
        </div>
    );
};

export default CustomView;
