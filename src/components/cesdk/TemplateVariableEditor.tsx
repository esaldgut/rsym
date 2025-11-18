/**
 * YAAN Template Variable Editor
 *
 * UI para editar variables de texto en templates de momentos.
 *
 * FASE D: Variable System & Moment Templates (2025-11-18)
 *
 * Features:
 * - Form-based variable editing
 * - Real-time preview updates
 * - Validation (maxLength, required fields)
 * - Reset to defaults
 * - Character counters
 * - Integration with CE.SDK Variable API
 *
 * Architecture:
 * - Uses CE.SDK Variable API (variable.setString(), variable.getString())
 * - React Hook Form for form management
 * - Real-time sync with CE.SDK canvas
 *
 * References:
 * - CE.SDK Variable API: docs/CESDK_NEXTJS_LLMS_FULL.txt (lines 21626-21709)
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { CreativeEditorSDK } from '@cesdk/cesdk-js';
import type { MomentTemplate, TemplateVariable } from './MomentTemplateLibrary';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateVariableEditorProps {
  cesdkInstance: CreativeEditorSDK;
  template: MomentTemplate;
  onSave?: (values: Record<string, string>) => void;
  onCancel?: () => void;
}

export interface VariableFormValues {
  [key: string]: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateVariableEditor({
  cesdkInstance,
  template,
  onSave,
  onCancel
}: TemplateVariableEditorProps) {
  // Form state
  const [values, setValues] = useState<VariableFormValues>(() => {
    // Initialize with default values
    const initialValues: VariableFormValues = {};
    template.variables.forEach(variable => {
      initialValues[variable.name] = variable.defaultValue;
    });
    return initialValues;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load current values from CE.SDK on mount
  useEffect(() => {
    if (!cesdkInstance) return;

    const engine = cesdkInstance.engine;
    const currentValues: VariableFormValues = {};

    template.variables.forEach(variable => {
      try {
        const value = engine.variable.getString(variable.name);
        currentValues[variable.name] = value || variable.defaultValue;
      } catch (error) {
        console.warn(`[TemplateVariableEditor] Variable not found: ${variable.name}`);
        currentValues[variable.name] = variable.defaultValue;
      }
    });

    setValues(currentValues);
    console.log('[TemplateVariableEditor] 📥 Loaded current values:', currentValues);
  }, [cesdkInstance, template]);

  // Update CE.SDK variable in real-time
  const updateVariable = useCallback((variableName: string, value: string) => {
    if (!cesdkInstance) return;

    try {
      const engine = cesdkInstance.engine;
      engine.variable.setString(variableName, value);
      console.log(`[TemplateVariableEditor] ✅ Updated variable: ${variableName} = "${value}"`);
    } catch (error) {
      console.error(`[TemplateVariableEditor] ❌ Error updating variable: ${variableName}`, error);
    }
  }, [cesdkInstance]);

  // Handle input change
  const handleChange = useCallback((variableName: string, value: string, variable: TemplateVariable) => {
    // Validate maxLength
    if (variable.maxLength && value.length > variable.maxLength) {
      setErrors(prev => ({
        ...prev,
        [variableName]: `Máximo ${variable.maxLength} caracteres`
      }));
      return;
    }

    // Clear error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[variableName];
      return newErrors;
    });

    // Update local state
    setValues(prev => ({ ...prev, [variableName]: value }));

    // Update CE.SDK in real-time
    updateVariable(variableName, value);
  }, [updateVariable]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaultValues: VariableFormValues = {};

    template.variables.forEach(variable => {
      defaultValues[variable.name] = variable.defaultValue;
      updateVariable(variable.name, variable.defaultValue);
    });

    setValues(defaultValues);
    setErrors({});

    console.log('[TemplateVariableEditor] 🔄 Reset to defaults');
  }, [template, updateVariable]);

  // Handle save
  const handleSave = useCallback(() => {
    // Validate all fields
    const newErrors: Record<string, string> = {};

    template.variables.forEach(variable => {
      const value = values[variable.name] || '';

      // Check required (all variables are required for now)
      if (value.trim() === '') {
        newErrors[variable.name] = 'Este campo es requerido';
      }

      // Check maxLength
      if (variable.maxLength && value.length > variable.maxLength) {
        newErrors[variable.name] = `Máximo ${variable.maxLength} caracteres`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log('[TemplateVariableEditor] ❌ Validation errors:', newErrors);
      return;
    }

    // Call parent callback
    if (onSave) {
      onSave(values);
    }

    console.log('[TemplateVariableEditor] ✅ Saved values:', values);
  }, [values, template, onSave]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Personaliza tu Template
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {template.name} - {template.description}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {template.variables.map(variable => {
          const value = values[variable.name] || '';
          const error = errors[variable.name];
          const charCount = value.length;
          const maxLength = variable.maxLength || 0;
          const isNearLimit = maxLength > 0 && charCount > maxLength * 0.8;

          return (
            <div key={variable.name} className="space-y-2">
              {/* Label */}
              <label
                htmlFor={variable.name}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {variable.label}
                {variable.maxLength && (
                  <span className={`ml-2 text-xs ${isNearLimit ? 'text-orange-500' : 'text-gray-400'}`}>
                    {charCount}/{variable.maxLength}
                  </span>
                )}
              </label>

              {/* Input */}
              {variable.maxLength && variable.maxLength > 50 ? (
                // Textarea for longer content
                <textarea
                  id={variable.name}
                  value={value}
                  onChange={(e) => handleChange(variable.name, e.target.value, variable)}
                  placeholder={variable.placeholder}
                  rows={3}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-all
                    ${error
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-pink-500'
                    }
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:outline-none
                    resize-none
                  `}
                />
              ) : (
                // Text input for shorter content
                <input
                  type="text"
                  id={variable.name}
                  value={value}
                  onChange={(e) => handleChange(variable.name, e.target.value, variable)}
                  placeholder={variable.placeholder}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-all
                    ${error
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-pink-500'
                    }
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:outline-none
                  `}
                />
              )}

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          Restaurar
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
        >
          Aplicar Cambios
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Vista previa en tiempo real</p>
            <p className="text-blue-600 dark:text-blue-400">
              Los cambios se reflejan automáticamente en el canvas mientras escribes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateVariableEditor;
