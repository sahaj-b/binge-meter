import * as React from "react";
import { cn } from "@/apps/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ trigger, children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="w-full"
      >
        {trigger}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full z-50 bg-white border border-gray-200 rounded-md shadow-lg">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === DropdownItem) {
              return React.cloneElement(
                child as React.ReactElement<DropdownItemProps>,
                { onItemClick: closeDropdown },
              );
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  onItemClick?: () => void;
}

export function DropdownItem({
  children,
  onClick,
  className,
  onItemClick,
}: DropdownItemProps) {
  const handleClick = () => {
    onClick?.();
    onItemClick?.();
  };

  return (
    <button
      type="button"
      className={cn(
        "w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 first:rounded-t-md last:rounded-b-md",
        className,
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

