import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SearchableSelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (selection: T | null) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  renderOption?: (option: T) => React.ReactNode;
  placeholder?: string;
  label?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

function SearchableSelect<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  renderOption,
  placeholder = "انتخاب کنید...",
  label,
  onOpen,
  onClose
}: SearchableSelectProps<T>) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !isSearching) {
      setInputValue(getOptionLabel(value));
    } else if (!value) {
      setInputValue('');
    }
  }, [value, getOptionLabel, isSearching]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
      if(isOpen) {
        setIsOpen(false);
        onClose?.();
        setIsSearching(false);
        if (value) setInputValue(getOptionLabel(value));
        else setInputValue('');
      }
    }
  }, [value, getOptionLabel, onClose, isOpen]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleSelectOption = (option: T) => {
    onChange(option);
    setIsOpen(false);
    onClose?.();
    setIsSearching(false);
    setInputValue(getOptionLabel(option));
  };
  
  const filteredOptions = isSearching
    ? options.filter(option =>
        getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  return (
    <div ref={rootRef} className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            if (!isSearching) setIsSearching(true);
            if (!isOpen) {
              setIsOpen(true);
              onOpen?.();
            }
          }}
          onFocus={() => {
            if (!isOpen) {
              setIsOpen(true);
              onOpen?.();
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
        
        {isOpen && (
          <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-custom shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={getOptionValue(option)}
                  onMouseDown={() => handleSelectOption(option)}
                  className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-slate-500">موردی یافت نشد.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SearchableSelect;