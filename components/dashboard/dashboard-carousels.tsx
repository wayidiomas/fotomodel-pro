'use client';

import { useState, useEffect } from 'react';
import { ContentCarousel } from './content-carousel';
import { ItemDetailModal } from './item-detail-modal';
import { WelcomeBubbleModal } from './welcome-bubble-modal';
import { CarouselItem } from './content-carousel-item';
import { useCredits } from '@/contexts/credits-context';

interface DashboardCarouselsProps {
  uploads: CarouselItem[];
  models: CarouselItem[];
  downloads: CarouselItem[];
}

export function DashboardCarousels({
  uploads,
  models,
  downloads,
}: DashboardCarouselsProps) {
  const { updateCredits } = useCredits();
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);
  const [currentItems, setCurrentItems] = useState<CarouselItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check if user should see Bubble welcome modal and import wardrobe
  useEffect(() => {
    const checkBubbleWelcome = async () => {
      try {
        const response = await fetch('/api/user/bubble-welcome');
        if (response.ok) {
          const data = await response.json();
          if (data.shouldShow) {
            setShowWelcomeModal(true);

            // Also trigger wardrobe import for migrated users
            importBubbleWardrobe();
          }
        }
      } catch (error) {
        console.error('Error checking bubble welcome:', error);
      }
    };

    const importBubbleWardrobe = async () => {
      try {
        console.log('🔄 Starting Bubble wardrobe import...');
        const response = await fetch('/api/user/import-bubble-wardrobe', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Wardrobe import result:', data);

          if (data.itemsImported > 0) {
            console.log(`📦 Imported ${data.itemsImported} wardrobe items from Bubble`);
          }
        } else {
          console.error('Failed to import wardrobe:', await response.text());
        }
      } catch (error) {
        console.error('Error importing bubble wardrobe:', error);
      }
    };

    checkBubbleWelcome();
  }, []);

  const handleItemClick = (item: CarouselItem, items: CarouselItem[]) => {
    setSelectedItem(item);
    setCurrentItems(items);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleNavigate = (item: CarouselItem) => {
    setSelectedItem(item);
  };

  const handleWelcomeModalClose = async () => {
    setShowWelcomeModal(false);

    // Mark welcome modal as shown and add 50 credits
    try {
      const response = await fetch('/api/user/bubble-welcome', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.creditsAdded > 0) {
          console.log(`✅ Added ${data.creditsAdded} credits - New total: ${data.newTotal}`);
          // Update credits in context (updates header automatically)
          updateCredits(data.newTotal);
        }
      }
    } catch (error) {
      console.error('Error marking bubble welcome as shown:', error);
    }
  };

  return (
    <div className="space-y-12">
      {/* Últimas peças */}
      <ContentCarousel
        title="Últimas peças"
        items={uploads}
        viewAllHref="/wardrobe"
        onItemClick={(item) => handleItemClick(item, uploads)}
        emptyMessage="Nenhuma peça ainda"
        emptyDescription="Faça upload de suas roupas para começar"
      />

      {/* Últimas modelos */}
      <ContentCarousel
        title="Últimas modelos"
        items={models}
        viewAllHref="/modelos"
        onItemClick={(item) => handleItemClick(item, models)}
        emptyMessage="Nenhuma modelo ainda"
        emptyDescription="Crie modelos personalizadas na sua galeria"
      />

      {/* Últimos downloads */}
      <ContentCarousel
        title="Últimos downloads"
        items={downloads}
        viewAllHref="/galeria"
        onItemClick={(item) => handleItemClick(item, downloads)}
        emptyMessage="Nenhum download ainda"
        emptyDescription="Suas imagens baixadas aparecerão aqui"
      />

      {/* Modal de detalhes */}
      <ItemDetailModal
        item={selectedItem}
        items={currentItems}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNavigate={handleNavigate}
      />

      {/* Modal de boas-vindas para usuários do Bubble */}
      <WelcomeBubbleModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeModalClose}
      />
    </div>
  );
}
