import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, Check, RefreshCw } from 'lucide-react';
import {
  IdConfig,
  DEFAULT_ID_CONFIG,
  sanitizeInitials,
  validateIdConfig,
  generateId,
  formatIdForDisplay,
  ID_EXAMPLES
} from '../utils/idGenerator';

interface IdInitialsConfigProps {
  config: Partial<IdConfig>;
  onChange: (config: Partial<IdConfig>) => void;
  disabled?: boolean;
}

const IdInitialsConfig: React.FC<IdInitialsConfigProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const [localConfig, setLocalConfig] = useState<IdConfig>({
    ...DEFAULT_ID_CONFIG,
    ...config
  });
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: []
  });

  useEffect(() => {
    const newConfig = { ...DEFAULT_ID_CONFIG, ...config };
    setLocalConfig(newConfig);
    setValidation(validateIdConfig(newConfig));
  }, [config]);

  const handleInitialsChange = (field: keyof IdConfig, value: string) => {
    const sanitized = sanitizeInitials(value);
    const newConfig = { ...localConfig, [field]: sanitized };
    setLocalConfig(newConfig);

    const newValidation = validateIdConfig(newConfig);
    setValidation(newValidation);

    if (newValidation.isValid) {
      onChange(newConfig);
    }
  };

  const resetToDefaults = () => {
    setLocalConfig(DEFAULT_ID_CONFIG);
    setValidation({ isValid: true, errors: [] });
    onChange(DEFAULT_ID_CONFIG);
  };

  const useMorogoroExample = () => {
    const morogoroConfig: Partial<IdConfig> = {
      dioceseInitials: 'DOM',
      parishInitials: 'STM',
      clusterInitials: 'CHR',
      sccInitials: 'SCC',
      familyInitials: 'FAM',
      memberInitials: 'MEM',
    };
    setLocalConfig({ ...DEFAULT_ID_CONFIG, ...morogoroConfig });
    setValidation({ isValid: true, errors: [] });
    onChange(morogoroConfig);
  };

  const entityFields: { field: keyof IdConfig; label: string; description: string; example: string }[] = [
    {
      field: 'dioceseInitials',
      label: 'Diocese Initials',
      description: '3-character prefix for diocese IDs',
      example: 'DOM for Diocese of Morogoro'
    },
    {
      field: 'parishInitials',
      label: 'Parish Initials',
      description: '3-character prefix for parish IDs',
      example: 'STM for St. Mary\'s'
    },
    {
      field: 'clusterInitials',
      label: 'Cluster Initials',
      description: '3-character prefix for cluster IDs',
      example: 'CHR for Christian Community'
    },
    {
      field: 'sccInitials',
      label: 'SCC Initials',
      description: '3-character prefix for Small Christian Community IDs',
      example: 'SCC for Small Christian Community'
    },
    {
      field: 'familyInitials',
      label: 'Family Initials',
      description: '3-character prefix for family IDs',
      example: 'FAM for Family'
    },
    {
      field: 'memberInitials',
      label: 'Member Initials',
      description: '3-character prefix for member IDs',
      example: 'MEM for Member'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings size={20} />
            ID Initials Configuration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Customize 3-character prefixes for auto-generated IDs throughout the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={useMorogoroExample}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Morogoro Example
          </button>
          <button
            onClick={resetToDefaults}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Configuration Errors</h4>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entityFields.map(({ field, label, description, example }) => (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              {label}
            </label>
            <div className="relative">
              <input
                type="text"
                value={localConfig[field]}
                onChange={(e) => handleInitialsChange(field, e.target.value)}
                disabled={disabled}
                maxLength={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                placeholder="ABC"
              />
              <div className="absolute right-3 top-2.5 text-xs text-gray-500">
                {localConfig[field].length}/3
              </div>
            </div>
            <p className="text-xs text-gray-500">{description}</p>
            <p className="text-xs text-blue-600">Example: {example}</p>
          </div>
        ))}
      </div>

      {/* Preview Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">ID Format Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entityFields.map(({ field, label }) => {
            const entityType = field.replace('Initials', '') as keyof typeof ID_EXAMPLES.default;
            const sampleId = generateId(
              entityType as any,
              1,
              localConfig
            );
            const formattedId = formatIdForDisplay(sampleId);

            return (
              <div key={field} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
                <div className="text-sm font-mono text-gray-900">{formattedId}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Sample ID #001
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-xs font-medium text-blue-900 mb-2">How IDs are Generated:</h5>
          <div className="text-xs text-blue-800 space-y-1">
            <div>• Format: [3-CHARACTER INITIALS][6-DIGIT SEQUENCE]</div>
            <div>• Example: DOM000001 (Diocese of Morogoro, first diocese)</div>
            <div>• Display: DOM-000001 (formatted for readability)</div>
            <div>• Auto-incrementing: DOM000001, DOM000002, DOM000003...</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {validation.isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check size={16} />
          <span>Configuration is valid and ready to use</span>
        </div>
      )}
    </div>
  );
};

export default IdInitialsConfig;
