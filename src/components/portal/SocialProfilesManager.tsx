import React, { useState } from 'react';
import {
  Plus,
  Share2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Send,
  Globe,
  Pin,
} from 'lucide-react';
import { Customer, SocialAccountItem, SocialPlatform } from '../../types';
import { ImageUploadBox } from '../common/ImageUploadBox';
import {
  SOCIAL_PLATFORMS,
  buildProfileUrl,
  extractHandle,
  getCustomerSocialAccounts,
} from '../../utils/socialHelpers';
import { SocialCardWidget, getSocialPlatformIcon } from '../card/SocialCardWidget';

interface SocialProfilesManagerProps {
  customer: Customer;
  onUpdateCustomer: (updated: Customer) => void;
}

export const SocialProfilesManager: React.FC<SocialProfilesManagerProps> = ({
  customer,
  onUpdateCustomer,
}) => {
  const socialAccounts = getCustomerSocialAccounts(customer);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [handle, setHandle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [thumbnailType, setThumbnailType] = useState<'avatar' | 'logo' | 'custom'>('avatar');
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');
  const [verified, setVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const config = SOCIAL_PLATFORMS[platform] || SOCIAL_PLATFORMS.other;

  const openAddModal = (initialPlatform: SocialPlatform = 'instagram') => {
    setEditingId(null);
    setPlatform(initialPlatform);
    const pConfig = SOCIAL_PLATFORMS[initialPlatform] || SOCIAL_PLATFORMS.other;
    setHandle('');
    setUrl(pConfig.urlPrefix);
    setDescription(pConfig.defaultDescription);
    setFollowerCount('');
    setBadgeText(pConfig.defaultBadge);
    setThumbnailType('avatar');
    setCustomThumbnailUrl('');
    setVerified(true);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (account: SocialAccountItem) => {
    setEditingId(account.id);
    setPlatform(account.platform);
    setHandle(account.handleOrUsername);
    setUrl(account.url);
    setDescription(account.description || '');
    setFollowerCount(account.followerCount || '');
    setBadgeText(account.badgeText || SOCIAL_PLATFORMS[account.platform]?.defaultBadge || 'Follow');
    if (account.thumbnailUrl === customer.logoUrl && customer.logoUrl) {
      setThumbnailType('logo');
      setCustomThumbnailUrl('');
    } else if (account.thumbnailUrl === customer.avatarUrl || !account.thumbnailUrl) {
      setThumbnailType('avatar');
      setCustomThumbnailUrl('');
    } else {
      setThumbnailType('custom');
      setCustomThumbnailUrl(account.thumbnailUrl);
    }
    setVerified(account.verified ?? true);
    setErrorMsg('');
    setShowModal(true);
  };

  const handlePlatformChange = (newPlatform: SocialPlatform) => {
    setPlatform(newPlatform);
    const pConfig = SOCIAL_PLATFORMS[newPlatform] || SOCIAL_PLATFORMS.other;
    setBadgeText(pConfig.defaultBadge);
    if (!description || description === config.defaultDescription) {
      setDescription(pConfig.defaultDescription);
    }
    if (handle) {
      setUrl(buildProfileUrl(handle, newPlatform));
    } else {
      setUrl(pConfig.urlPrefix);
    }
  };

  const handleHandleChange = (val: string) => {
    setHandle(val);
    if (val.trim()) {
      setUrl(buildProfileUrl(val, platform));
    }
  };

  const handleDelete = (id: string) => {
    const updated = socialAccounts.filter((a) => a.id !== id);
    onUpdateCustomer({
      ...customer,
      socialAccounts: updated,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && !handle.trim()) {
      setErrorMsg('Please enter a username handle or profile link.');
      return;
    }

    const finalHandle = handle.trim() || extractHandle(url, platform) || `@${customer.firstName.toLowerCase()}`;
    const finalUrl = url.trim() || buildProfileUrl(finalHandle, platform);

    let finalThumbnail: string = customer.avatarUrl;
    if (thumbnailType === 'logo' && customer.logoUrl) {
      finalThumbnail = customer.logoUrl;
    } else if (thumbnailType === 'custom' && customThumbnailUrl.trim()) {
      finalThumbnail = customThumbnailUrl.trim();
    }

    const newItem: SocialAccountItem = {
      id: editingId || `soc-${Date.now()}`,
      platform,
      title: SOCIAL_PLATFORMS[platform]?.name || 'Social',
      handleOrUsername: finalHandle,
      url: finalUrl,
      description: description.trim(),
      thumbnailUrl: finalThumbnail,
      followerCount: followerCount.trim() || undefined,
      badgeText: badgeText.trim() || SOCIAL_PLATFORMS[platform]?.defaultBadge || 'Follow',
      verified,
    };

    let updatedList: SocialAccountItem[];
    if (editingId) {
      updatedList = socialAccounts.map((item) => (item.id === editingId ? newItem : item));
    } else {
      updatedList = [...socialAccounts, newItem];
    }

    onUpdateCustomer({
      ...customer,
      socialAccounts: updatedList,
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header card with information and primary action */}
      <div className="glass-card p-5 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Social Media Profile Cards & Thumbnails
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {socialAccounts.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Display your Instagram, LinkedIn, Facebook, YouTube, or WhatsApp accounts as rich, interactive thumbnail cards on your mini website.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddModal('instagram')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Social Account</span>
        </button>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/60 dark:border-white/10">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Add Popular Platforms:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openAddModal('instagram')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 transition-colors flex items-center gap-1.5"
          >
            <Instagram className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>+ Instagram</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('linkedin')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 transition-colors flex items-center gap-1.5"
          >
            <Linkedin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>+ LinkedIn</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('facebook')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 transition-colors flex items-center gap-1.5"
          >
            <Facebook className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>+ Facebook</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('youtube')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 transition-colors flex items-center gap-1.5"
          >
            <Youtube className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>+ YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('whatsapp_channel')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+ WhatsApp Channel</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('twitter')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Twitter className="w-3.5 h-3.5" />
            <span>+ X (Twitter)</span>
          </button>
        </div>
      </div>

      {/* Grid of Live Social Account Thumbnail Cards */}
      {socialAccounts.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            No Social Profiles Added Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Connect your Instagram reels, LinkedIn profile, or Facebook page so visitors can discover and follow your business.
          </p>
          <button
            type="button"
            onClick={() => openAddModal('instagram')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Add Your First Profile Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {socialAccounts.map((account) => (
            <SocialCardWidget
              key={account.id}
              account={account}
              defaultAvatar={customer.avatarUrl}
              onEdit={openEditModal}
              onDelete={handleDelete}
              isEditable={true}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal Drawer */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/60 dark:border-white/10 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white ${config.accentBg} shadow-sm`}>
                  {getSocialPlatformIcon(platform, 'w-4 h-4')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {editingId ? 'Edit Social Profile Card' : 'Add Social Media Profile Card'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Display thumbnail, account handle & verified badge
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {/* Select Platform */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Social Media Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => handlePlatformChange(e.target.value as SocialPlatform)}
                  className="glass-input text-xs font-medium cursor-pointer"
                >
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="whatsapp_channel">WhatsApp Channel</option>
                  <option value="twitter">X (formerly Twitter)</option>
                  <option value="telegram">Telegram</option>
                  <option value="threads">Threads</option>
                  <option value="github">GitHub</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="website">Website / Portfolio</option>
                  <option value="google_reviews">Google Reviews (GMB)</option>
                  <option value="other">Custom Link</option>
                </select>
              </div>

              {/* Username / Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username / Handle
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => handleHandleChange(e.target.value)}
                    placeholder={config.placeholderHandle}
                    className="glass-input text-xs font-mono"
                  />
                </div>

                {/* Follower Count / Metric */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audience / Followers (Optional)
                  </label>
                  <input
                    type="text"
                    value={followerCount}
                    onChange={(e) => setFollowerCount(e.target.value)}
                    placeholder="e.g. 14.8K followers, 500+ connections"
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              {/* Profile URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Profile URL / Direct Link
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={config.placeholderUrl}
                  className="glass-input text-xs font-mono"
                  required
                />
              </div>

              {/* Description / Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Description / Highlight
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Follow for daily grooming reels, bridal lookbooks..."
                  className="glass-input text-xs"
                />
              </div>

              {/* Thumbnail Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Thumbnail / Profile Picture on Card
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setThumbnailType('avatar')}
                    className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                      thumbnailType === 'avatar'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    My Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailType('logo')}
                    className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                      thumbnailType === 'logo'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Business Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailType('custom')}
                    className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                      thumbnailType === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Custom Photo
                  </button>
                </div>

                {thumbnailType === 'custom' && (
                  <div className="mt-2">
                    <ImageUploadBox
                      id="upload-social-thumbnail"
                      label="Upload Custom Photo"
                      value={customThumbnailUrl}
                      onChange={(newUrl) => setCustomThumbnailUrl(newUrl)}
                      onRemove={() => setCustomThumbnailUrl('')}
                      aspectRatio="square"
                      maxWidth={300}
                      maxHeight={300}
                    />
                  </div>
                )}
              </div>

              {/* Button text & Verified Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder={config.defaultBadge}
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                      Show Verified Profile Tick
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
                >
                  {editingId ? 'Save Changes' : 'Add Profile Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
