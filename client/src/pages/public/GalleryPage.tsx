import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { GalleryAlbumData } from '../../types';
import { Image as ImageIcon, X, ZoomIn, Calendar, Sparkles, Loader2 } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const { tBilingual, language } = useLanguage();
  const [albums, setAlbums] = useState<GalleryAlbumData[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string>('ALL');
  const [activeImage, setActiveImage] = useState<{ src: string; caption: string; marathiCaption: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/gallery')
      .then((res) => {
        if (res.data?.success) setAlbums(res.data.data);
      })
      .catch((err) => console.error('Failed to load gallery albums:', err))
      .finally(() => setLoading(false));
  }, []);

  const allPhotos = albums.flatMap((album) => album.images);

  const displayedPhotos =
    activeAlbumId === 'ALL'
      ? allPhotos
      : albums.find((a) => a._id === activeAlbumId)?.images || [];

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="green" size="md">
            {tBilingual('छायाचित्रे व कार्यक्रम अल्बम्स', 'Photo Gallery & Event Albums')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('शालेय उपक्रम, स्पर्धा व सांस्कृतिक महोत्सव', 'School Activities, Competitions & Gatherings')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'वार्षिक स्नेहसंमेलन, क्रीडा स्पर्धा, विज्ञान प्रदर्शन, वृक्षारोपण व स्वच्छता मोहिमेचे वास्तव छायाचित्रे',
              'Glimpses of annual gatherings, athletic meets, science exhibitions, tree plantation, and cleanliness campaigns'
            )}
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green dark:text-emerald-400 animate-spin" />
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('छायाचित्र दालन लोड होत आहे...', 'Loading photo gallery albums...')}
            </span>
          </div>
        ) : (
          <>
            {/* Album Selector Tabs */}
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => setActiveAlbumId('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAlbumId === 'ALL'
                    ? 'bg-primary-green text-white shadow'
                    : 'bg-light-green dark:bg-dark-card text-main-text dark:text-dark-text hover:bg-light-green-hover dark:hover:bg-[#374151] border border-border-green dark:border-dark-border'
                }`}
              >
                {tBilingual('सर्व छायाचित्रे', 'All Photos')} ({allPhotos.length})
              </button>

              {albums.map((album) => (
                <button
                  key={album._id}
                  onClick={() => setActiveAlbumId(album._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeAlbumId === album._id
                      ? 'bg-primary-green text-white shadow'
                      : 'bg-light-green dark:bg-dark-card text-main-text dark:text-dark-text hover:bg-light-green-hover dark:hover:bg-[#374151] border border-border-green dark:border-dark-border'
                  }`}
                >
                  {album.category} ({album.images.length})
                </button>
              ))}
            </div>

            {/* Active Album Description Note */}
            {activeAlbumId !== 'ALL' && (
              <div className="p-4 rounded-xl bg-light-green/70 dark:bg-dark-secondary border border-border-green dark:border-dark-border flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-saffron-orange shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-main-text dark:text-dark-text">
                    {language === 'mr'
                      ? albums.find((a) => a._id === activeAlbumId)?.marathiTitle ||
                        albums.find((a) => a._id === activeAlbumId)?.title
                      : language === 'en'
                      ? albums.find((a) => a._id === activeAlbumId)?.title ||
                        albums.find((a) => a._id === activeAlbumId)?.marathiTitle
                      : `${albums.find((a) => a._id === activeAlbumId)?.marathiTitle} (${
                          albums.find((a) => a._id === activeAlbumId)?.title
                        })`}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted mt-0.5">
                    {albums.find((a) => a._id === activeAlbumId)?.description}
                  </p>
                </div>
              </div>
            )}

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayedPhotos.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className="group relative rounded-xl overflow-hidden border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col"
                >
                  <div className="h-52 overflow-hidden bg-light-green dark:bg-[#18251F] relative">
                    <img
                      src={img.src}
                      alt={img.caption}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-white/80 dark:bg-dark-card text-primary-green dark:text-emerald-400 shadow">
                        <ZoomIn className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-main-text dark:text-dark-text leading-snug">
                        {language === 'mr'
                          ? img.marathiCaption || img.caption
                          : language === 'en'
                          ? img.caption || img.marathiCaption
                          : `${img.marathiCaption} (${img.caption})`}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col border border-border-green dark:border-dark-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
              <div>
                <h3 className="font-bold text-sm text-main-text dark:text-dark-text">
                  {language === 'mr'
                    ? activeImage.marathiCaption || activeImage.caption
                    : language === 'en'
                    ? activeImage.caption || activeImage.marathiCaption
                    : `${activeImage.marathiCaption} (${activeImage.caption})`}
                </h3>
              </div>
              <button
                onClick={() => setActiveImage(null)}
                className="p-1 rounded-lg text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-white hover:bg-light-green dark:hover:bg-[#374151]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 overflow-auto flex items-center justify-center max-h-[70vh]">
              <img
                src={activeImage.src}
                alt={activeImage.caption}
                className="max-h-[68vh] max-w-full rounded-lg object-contain shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
