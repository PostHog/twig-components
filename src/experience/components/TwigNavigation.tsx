"use client";
import { createContext, useContext, type AnchorHTMLAttributes, type ReactNode } from 'react';
export type TwigNavigationValue = {pathname:string;portalRoot:HTMLElement;router:{push:(href:string)=>void;replace:(href:string)=>void;back:()=>void;forward:()=>void;refresh:()=>void;prefetch:(href:string)=>void}};
const Context=createContext<TwigNavigationValue|null>(null);
export function TwigNavigationProvider({value,children}:{value:TwigNavigationValue;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>;}
export function useTwigPreview(){return useContext(Context);}
export function usePathname(){return useContext(Context)!.pathname;}
export function useRouter(){return useContext(Context)!.router;}
export default function TwigLink({onClick,...props}:AnchorHTMLAttributes<HTMLAnchorElement>){const navigation=useContext(Context)!;return <a {...props} onClick={event=>{onClick?.(event);if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||props.target==='_blank')return;if(props.href?.startsWith('/')){event.preventDefault();navigation.router.push(props.href);}}}/>;}
