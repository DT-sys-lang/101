'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import type { Locale } from '@/i18n/routing'
import type { ProductNavigationGroupViewModel, ProductNavigationViewModel } from '@/lib/domain/product-navigation'

interface ProductMegaMenuProps {
  readonly locale: Locale
  readonly label: string
  readonly active: boolean
  readonly navigation: ProductNavigationViewModel
}

interface MobileProductNavigationProps {
  readonly locale: Locale
  readonly label: string
  readonly navigation: ProductNavigationViewModel
}

export function ProductMegaMenu({ locale, label, active, navigation }: ProductMegaMenuProps) {
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(navigation.groups[0]?.id ?? '')
  const selectedGroup = getSelectedGroup(navigation, selectedGroupId)

  useEffect(() => {
    if (!navigation.groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(navigation.groups[0]?.id ?? '')
    }
  }, [navigation.groups, selectedGroupId])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-current={active ? 'page' : undefined}
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="product-mega-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        className={active
          ? 'cursor-pointer border-b-2 border-[#005EB8] pb-1 text-[17px] font-semibold leading-none text-[#005EB8] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005EB8]'
          : 'cursor-pointer border-b-2 border-transparent pb-1 text-[17px] font-medium leading-none text-[#202426] outline-none transition-colors hover:text-[#005EB8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005EB8]'}
      >
        {label}
      </button>
      {open && selectedGroup ? (
        <section
          id={menuId}
          role="dialog"
          aria-label={navigation.categoryLabel}
          data-testid="product-mega-menu"
          className="absolute inset-x-0 top-full border-y border-[#D7DBDF] bg-white shadow-[0_14px_28px_rgba(0,38,74,0.14)]"
        >
          <div className="mx-auto grid max-h-[calc(100vh-8rem)] w-full max-w-[1440px] grid-cols-[minmax(210px,0.72fr)_minmax(0,1.65fr)_minmax(245px,0.82fr)] overflow-y-auto px-16 lg:px-20">
            <div className="border-r border-[#E5E5E5] py-6 pr-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5D5F5F]">{navigation.categoryLabel}</p>
              <div className="flex flex-col">
                {navigation.groups.map((group) => {
                  const selected = group.id === selectedGroup.id

                  return (
                    <button
                      key={group.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={selected
                        ? 'cursor-pointer border-l-2 border-[#005EB8] bg-[#F2F7FB] px-4 py-3 text-left text-sm font-semibold text-[#005EB8] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#005EB8]'
                        : 'cursor-pointer border-l-2 border-transparent px-4 py-3 text-left text-sm font-medium text-[#202426] outline-none transition-colors hover:bg-[#F7FAFC] hover:text-[#005EB8] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#005EB8]'}
                    >
                      {group.label}
                    </button>
                  )
                })}
              </div>
              <Link
                href={`/${locale}${navigation.overviewHref}`}
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex border-b border-[#005EB8] pb-1 text-sm font-semibold text-[#005EB8] outline-none transition-colors hover:text-[#003F7A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005EB8]"
              >
                {navigation.overviewLabel}
              </Link>
            </div>

            <div className="py-6 pl-7 pr-8">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#5D5F5F]">{selectedGroup.label}</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {selectedGroup.children.map((category) => (
                  <div key={category.id} className="min-w-0">
                    <Link
                      href={`/${locale}${category.href}`}
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold text-[#1A1A1A] outline-none transition-colors hover:text-[#005EB8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#005EB8]"
                    >
                      {category.label}
                    </Link>
                    {category.children.length > 0 ? (
                      <div className="mt-2 flex flex-col gap-2">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/${locale}${child.href}`}
                            onClick={() => setOpen(false)}
                            className="text-sm text-[#5D5F5F] outline-none transition-colors hover:text-[#005EB8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005EB8]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <aside className="border-l border-[#E5E5E5] bg-[#F7FAFC] py-6 pl-7 pr-6">
              <h2 className="text-lg font-semibold leading-tight text-[#1A1A1A]">{selectedGroup.label}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5D5F5F]">{selectedGroup.description}</p>
              <p className="mt-5 border-t border-[#D7DBDF] pt-4 text-sm font-semibold text-[#202426]">{selectedGroup.productCountLabel}</p>
              <Link
                href={`/${locale}${selectedGroup.href}`}
                onClick={() => setOpen(false)}
                className="mt-5 inline-flex border-b border-[#005EB8] pb-1 text-sm font-semibold text-[#005EB8] outline-none transition-colors hover:text-[#003F7A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005EB8]"
              >
                {selectedGroup.viewAllLabel}
              </Link>
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export function MobileProductNavigation({ locale, label, navigation }: MobileProductNavigationProps) {
  const [open, setOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(navigation.groups[0]?.id ?? '')
  const selectedGroup = getSelectedGroup(navigation, selectedGroupId)

  return (
    <div className="border-b border-[#E5E5E5]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="w-full cursor-pointer px-3 py-3 text-left text-sm font-medium text-[#1A1A1A] outline-none transition-colors hover:text-[#005EB8] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#005EB8]"
      >
        {label}
      </button>
      {open && selectedGroup ? (
        <div className="border-t border-[#E5E5E5] bg-[#F7FAFC] px-3 py-3">
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {navigation.groups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={group.id === selectedGroup.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={group.id === selectedGroup.id
                  ? 'cursor-pointer border-b-2 border-[#005EB8] pb-1 text-left text-sm font-semibold text-[#005EB8] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005EB8]'
                  : 'cursor-pointer border-b-2 border-transparent pb-1 text-left text-sm font-medium text-[#202426] outline-none hover:text-[#005EB8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005EB8]'}
              >
                {group.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {selectedGroup.children.map((category) => (
              <div key={category.id}>
                <Link href={`/${locale}${category.href}`} className="text-sm font-semibold text-[#1A1A1A] hover:text-[#005EB8]">
                  {category.label}
                </Link>
                {category.children.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-2 border-l border-[#C9D2DA] pl-3">
                    {category.children.map((child) => (
                      <Link key={child.id} href={`/${locale}${child.href}`} className="text-sm text-[#5D5F5F] hover:text-[#005EB8]">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <Link href={`/${locale}${selectedGroup.href}`} className="mt-5 inline-flex border-b border-[#005EB8] pb-1 text-sm font-semibold text-[#005EB8]">
            {selectedGroup.viewAllLabel}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function getSelectedGroup(navigation: ProductNavigationViewModel, selectedGroupId: string): ProductNavigationGroupViewModel | undefined {
  return navigation.groups.find((group) => group.id === selectedGroupId) ?? navigation.groups[0]
}
