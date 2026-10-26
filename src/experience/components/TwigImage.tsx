import type {ImgHTMLAttributes} from 'react';
import {experienceAssets} from '../assets.js';
/** Native images with package-owned assets; no framework/runtime image service. */
export default function TwigImage({src,fill,priority,unoptimized:_,...props}:ImgHTMLAttributes<HTMLImageElement>&{fill?:boolean;priority?:boolean;unoptimized?:boolean}){return <img {...props} className={[props.className,fill?'twig-experience-image-fill':''].filter(Boolean).join(' ')} src={src ? experienceAssets[src] ?? src : undefined} loading={priority?'eager':props.loading}/>;}
