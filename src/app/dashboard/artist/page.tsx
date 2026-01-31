"use client";

import React from 'react';
import GlassButton from '@/components/ui/GlassButton';

export default function ArtistDashboardPage() {
	return (
		<>
			{/* Dashboard Header */}
			<header className="glass-card p-6 mb-8 max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold gradient-text">Artist Dashboard</h1>
			</header>

			{/* Dashboard Content */}
			<div className="glass-card p-8 max-w-4xl mx-auto">
				<p>Create and manage your split sheets here.</p>
				<GlassButton className="mt-6" onClick={() => (window.location.href = '/splits/new')}>
					New Split Sheet
				</GlassButton>
			</div>
		</>
	);
}
