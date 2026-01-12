import React from 'react'
import Image from 'next/image';
import { COMMON_TOOLTIP_KEYS, Tooltip } from './Tooltip';
import { useTooltipContentResolver } from '@/components/Tooltip';
import type { SvgTooltipProps } from './Tooltip/types';

export type SvgProps = React.SVGProps<SVGSVGElement> & SvgTooltipProps;
export type ImageProps = {
  width?: number;
  height?: number;
  className?: string;
}

// Helper function to resolve tooltip content with enhanced translation support
function useTooltipContent(tooltip?: string | { en: string; vi: string }): string | undefined {
  const resolveContent = useTooltipContentResolver();
  return resolveContent(tooltip);
}

// Enhanced SVG wrapper component using CSS hover
function SvgWithTooltip({
  children,
  tooltip,
  tooltipPlacement = 'auto',
  ...props
}: {
  children: React.ReactElement;
  tooltip?: string | { en: string; vi: string };
  tooltipPlacement?: SvgTooltipProps['tooltipPlacement'];
} & React.SVGProps<SVGSVGElement>) {
  const tooltipContent = useTooltipContent(tooltip);

  if (!tooltip) {
    return React.cloneElement(children, props);
  }

  return (
    <div className="svg-tooltip-container" tabIndex={0} aria-describedby={tooltipContent ? 'tooltip' : undefined}>
      {React.cloneElement(children, props)}
      <Tooltip
        content={tooltipContent}
        placement={tooltipPlacement}
        id="tooltip"
      />
    </div>
  );
}

export const SvgMenu = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </SvgWithTooltip>
)

export const SvgClose = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCart = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCheck = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  </SvgWithTooltip>
)

export const SvgChevronRight = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </SvgWithTooltip>
)

export const SvgPlus = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  </SvgWithTooltip>
)

export const SvgInfo = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgHome = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  </SvgWithTooltip>
)

export const SvgBoxes = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  </SvgWithTooltip>
)

export const SvgGrid = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgClipboard = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  </SvgWithTooltip>
)

export const SvgUsers = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgTag = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgDocument = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgChart = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgChevronLeftSolid = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgChevronRightSolid = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCurrency = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgSettings = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgWindow = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666" />
    </svg>
  </SvgWithTooltip>
)

export const SvgGlobe = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#a)">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666" />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h16v16H0z" />
        </clipPath>
      </defs>
    </svg>
  </SvgWithTooltip>
)

export const SvgNext = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80">
      <path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z" />
      <path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgVercel = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 1155 1000" xmlns="http://www.w3.org/2000/svg">
      <path d="m577.3 0 577.4 1000H0z" fill="#fff" />
    </svg>
  </SvgWithTooltip>
)

export const SvgFile = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clipRule="evenodd" fill="#666" fillRule="evenodd" />
    </svg>
  </SvgWithTooltip>
)

export const SvgFacebook = ({ tooltip = COMMON_TOOLTIP_KEYS.FACEBOOK, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgTwitter = ({ tooltip = COMMON_TOOLTIP_KEYS.TWITTER, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgTikTok = ({ tooltip = COMMON_TOOLTIP_KEYS.TIKTOK, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  </SvgWithTooltip>
)

const zalo64 = "data:image/png;base64,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";
export const SvgZalo = ({ tooltip = COMMON_TOOLTIP_KEYS.ZALO, tooltipPlacement, ...props }: ImageProps & SvgTooltipProps) => {
  const tooltipContent = useTooltipContent(tooltip);

  if (!tooltip) {
    return (
      <Image
        style={{opacity: 1}}
        src={zalo64}
        alt="Zalo svg"
        width={props.width || 24}
        height={props.height || 24}
        priority={true}
        unoptimized
        className={props.className}
      />
    );
  }

  return (
    <div className="svg-tooltip-container" tabIndex={0} aria-describedby={tooltipContent ? 'tooltip' : undefined}>
      <Image
        style={{opacity: 1}}
        src={zalo64}
        alt="Zalo svg"
        width={props.width || 24}
        height={props.height || 24}
        priority={true}
        unoptimized
        className={props.className}
      />
      <Tooltip
        content={tooltipContent}
        placement={tooltipPlacement}
        id="tooltip"
      />
    </div>
  );
}

export const SvgWhatsApp = ({ tooltip = COMMON_TOOLTIP_KEYS.WHATSAPP, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgPlay = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgPause = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgAlertTriangle = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgChevronLeft = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </SvgWithTooltip>
)

export const SvgChevronDown = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </SvgWithTooltip>
)

export const SvgLanguage = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  </SvgWithTooltip>
)

export const SvgSearch = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgImage = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgSpinner = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgRefresh = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  </SvgWithTooltip>
)

export const SvgShoppingBag = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgUser = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgLogin = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd"
            d="M8 6C8 3.79086 9.79086 2 12 2H17.5C19.9853 2 22 4.01472 22 6.5V17.5C22 19.9853 19.9853 22 17.5 22H12C9.79086 22 8 20.2091 8 18V17C8 16.4477 8.44772 16 9 16C9.55228 16 10 16.4477 10 17V18C10 19.1046 10.8954 20 12 20H17.5C18.8807 20 20 18.8807 20 17.5V6.5C20 5.11929 18.8807 4 17.5 4H12C10.8954 4 10 4.89543 10 6V7C10 7.55228 9.55228 8 9 8C8.44772 8 8 7.55228 8 7V6ZM12.2929 8.29289C12.6834 7.90237 13.3166 7.90237 13.7071 8.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L13.7071 15.7071C13.3166 16.0976 12.6834 16.0976 12.2929 15.7071C11.9024 15.3166 11.9024 14.6834 12.2929 14.2929L13.5858 13L5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11L13.5858 11L12.2929 9.70711C11.9024 9.31658 11.9024 8.68342 12.2929 8.29289Z"
            fill="#0F1729"/>
      {/*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />*/}
    </svg>
  </SvgWithTooltip>
)

export const SvgLogout = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  </SvgWithTooltip>
)

export const SvgEmail = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgPhone = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgLocation = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgMessage = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgTruck = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCreditCard = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgWarning = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgBankCard = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgQrCode = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgExclamationCircle = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCheckCircleXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  </SvgWithTooltip>
)

export const SvgXCircleXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  </SvgWithTooltip>
)

export const SvgExclamationTriangleXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  </SvgWithTooltip>
)

export const SvgInformationCircleXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCheckCircleLargeXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgExclamationCircleLargeXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgPrintXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgViewListXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  </SvgWithTooltip>
)

export const SvgCalendarXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgClockXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgArrowLeftXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  </SvgWithTooltip>
)

export const SvgArrowRightXXX = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  </SvgWithTooltip>
)

export const SvgXEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </SvgWithTooltip>
)

export const SvgMailEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgDotsEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgImagePlaceholderEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgUploadEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  </SvgWithTooltip>
)

export const SvgErrorEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </SvgWithTooltip>
)

export const SvgTrashEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </SvgWithTooltip>
)

export const SvgFolderEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  </SvgWithTooltip>
)

export const SvgImageUploadEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg stroke="currentColor" fill="none" viewBox="0 0 48 48">
      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SvgWithTooltip>
)

export const SvgGoogleEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  </SvgWithTooltip>
)

export const SvgDragHandleEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
    </svg>
  </SvgWithTooltip>
)

export const SvgLockEEE = ({ tooltip, tooltipPlacement, ...props }: SvgProps) => (
  <SvgWithTooltip tooltip={tooltip} tooltipPlacement={tooltipPlacement} {...props}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  </SvgWithTooltip>
)