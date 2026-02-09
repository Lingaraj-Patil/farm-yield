// ===================================
// FILE: frontend/src/components/ReportFormWizard.jsx
// Multi-Step Report Submission Wizard
// ===================================

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Upload, MapPin, Image as ImageIcon, CloudOff, CloudUpload, ChevronRight, ChevronLeft, Check, Loader, Package, Map, Droplets } from 'lucide-react';
import { reportAPI } from '../utils/api';
import { enqueueReport, getQueueCount, processQueue } from '../utils/offlineQueue';

const CROP_TYPES = ['wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'mango', 'potato', 'onion', 'other'];
const UNITS = ['kg', 'tons', 'maunds', 'acres'];
const SOIL_TYPES = ['loamy', 'sandy', 'clay', 'silt', 'peaty', 'chalky'];
const IRRIGATION_TYPES = ['rain-fed', 'drip', 'sprinkler', 'flood', 'furrow'];

const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[...Array(totalSteps)].map((_, i) => {
        const stepNumber = i + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
              isComplete 
                ? 'bg-green-600 text-white' 
                : isCurrent 
                  ? 'bg-green-600 text-white ring-4 ring-green-100' 
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {isComplete ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-1 mx-2 rounded ${
                stepNumber < currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ReportFormWizard = ({ onSuccess }) => {
  const { connected, publicKey } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: 'wheat',
    quantity: '',
    unit: 'kg',
    latitude: '',
    longitude: '',
    district: '',
    province: '',
    village: '',
    soilType: '',
    irrigation: '',
    harvestDate: '',
    marketPrice: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 5 - images.length);
    setImages([...images, ...newImages]);

    // Generate previews
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
        });

        // Reverse geocoding (simplified - you can use a real API)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          
          if (data.address) {
            setFormData(prev => ({
              ...prev,
              district: data.address.county || data.address.city || '',
              province: data.address.state || '',
              village: data.address.village || data.address.town || '',
            }));
          }
        } catch (error) {
          // Silent fail - GPS coordinates still captured
        }
        
        setLocationLoading(false);
      },
      (error) => {
        alert('Location access denied');
        setLocationLoading(false);
      }
    );
  };

  const validateStep = () => {
    if (currentStep === 1) {
      return formData.cropType && formData.quantity && formData.unit;
    }
    if (currentStep === 2) {
      return formData.latitude && formData.longitude && formData.district;
    }
    return true;
  };

  const nextStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      const stepErrors = {
        1: 'Please select a crop type and enter the quantity',
        2: 'Please add your location (GPS coordinates and district required)',
        3: 'Please review your submission'
      };
      alert(stepErrors[currentStep] || 'Please fill in all required fields');
    }
  };

  const prevStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow submission on step 3
    if (currentStep !== 3) {
      return;
    }
    
    if (!connected) {
      alert('Please connect your wallet');
      return;
    }

    if (!validateStep()) {
      alert('Please complete all required fields');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      images.forEach(image => {
        data.append('images', image);
      });

      const response = await reportAPI.submit(data);
      
      alert('✅ Report Submitted Successfully!\n\n🎉 Your crop report has been submitted for verification.\n💰 You will receive 0.01 SOL once 3 validators approve.\n🎫 A cNFT will be minted as proof of your report.\n\nThank you for contributing to decentralized agriculture!');
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        cropType: 'wheat',
        quantity: '',
        unit: 'kg',
        latitude: '',
        longitude: '',
        district: '',
        province: '',
        village: '',
        soilType: '',
        irrigation: '',
        harvestDate: '',
        marketPrice: '',
      });
      setImages([]);
      setImagePreviews([]);
      
      if (onSuccess) onSuccess(response.data.report);
      
    } catch (error) {
      // Handle offline vs server errors
      if (!navigator.onLine || !error.response) {
        await enqueueReport({ formData, images });
        alert('📴 Offline Mode\n\n✅ Your report has been saved locally.\n🔄 It will be automatically submitted when you reconnect to the internet.\n\nYou can view pending submissions in the queue panel.');
      } else {
        const errorMsg = error.response?.data?.message || error.message;
        alert(`❌ Submission Failed\n\n${errorMsg}\n\nPlease check your inputs and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Upload className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900">Connect Your Wallet</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Connect your Solana wallet to submit crop reports and earn rewards.
          Don't have a wallet? Install Phantom or Solflare extension.
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>✅ Submit verified crop reports</p>
          <p>✅ Earn 0.01 SOL per verified report</p>
          <p>✅ Receive proof-of-report NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Submit Crop Report</h2>
        <p className="text-green-100">Complete the 3-step wizard to earn 0.01 SOL</p>
      </div>

      <div className="p-8">
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {/* Step 1: Crop & Quantity */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-3">
                <Package className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Step 1: Crop Details</span>
              </div>
              <p className="text-gray-600">What did you harvest?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Crop Type *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {CROP_TYPES.map(crop => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setFormData({ ...formData, cropType: crop })}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      formData.cropType === crop
                        ? 'bg-green-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  aria-label="Crop quantity"
                  aria-required="true"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  aria-label="Measurement unit"
                  aria-required="true"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Photos */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-3">
                <Map className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Step 2: Location & Photos</span>
              </div>
              <p className="text-gray-600">Where was this harvested?</p>
            </div>

            <div>
              <button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                aria-label="Get current GPS location"
                aria-busy={locationLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-400"
              >
                {locationLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Get Current Location
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Latitude *"
                required
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Longitude *"
                required
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder="Village"
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="District *"
                required
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="State/Province *"
                required
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Photos (Optional, Max 5)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={images.length >= 5}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-gray-500">
                    {5 - images.length} photos remaining
                  </p>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-3 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Market & Soil Data */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-3">
                <Droplets className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Step 3: Additional Details</span>
              </div>
              <p className="text-gray-600">Optional but helps with verification</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Soil Type
                </label>
                <select
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select soil type</option>
                  {SOIL_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Irrigation Method
                </label>
                <select
                  name="irrigation"
                  value={formData.irrigation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select irrigation</option>
                  {IRRIGATION_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Harvest Date
                </label>
                <input
                  type="date"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Market Price (PKR/{formData.unit})
                </label>
                <input
                  type="number"
                  name="marketPrice"
                  value={formData.marketPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Enter price"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <h4 className="font-bold text-gray-900 mb-4">Report Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Crop:</span>
                  <span className="ml-2 font-semibold">{formData.cropType.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <span className="ml-2 font-semibold">{formData.quantity} {formData.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-semibold">{formData.district}, {formData.province}</span>
                </div>
                <div>
                  <span className="text-gray-600">Photos:</span>
                  <span className="ml-2 font-semibold">{images.length} uploaded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold flex items-center gap-2 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextStep();
              }}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold flex items-center gap-2 transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-400"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ReportFormWizard;
