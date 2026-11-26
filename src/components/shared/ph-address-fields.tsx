'use client'

import type { FieldErrors, Path, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PH_PROVINCES } from '@/lib/constants'

export interface PhilippineAddressFieldsValues {
  address_street: string
  address_barangay: string
  address_city: string
  address_province: string
  address_zip_code: string
}

interface PhilippineAddressFieldsProps<T extends PhilippineAddressFieldsValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  idPrefix: string
  streetLabel?: string
  streetPlaceholder?: string
  requiredMark?: boolean
  zipLabel?: string
}

export function PhilippineAddressFields<T extends PhilippineAddressFieldsValues>({
  register,
  errors,
  idPrefix,
  streetLabel = 'Street, Unit, Building, or Subdivision',
  streetPlaceholder,
  requiredMark = false,
  zipLabel = '4-Digit ZIP',
}: PhilippineAddressFieldsProps<T>) {
  const streetError = errors.address_street?.message as string | undefined
  const barangayError = errors.address_barangay?.message as string | undefined
  const cityError = errors.address_city?.message as string | undefined
  const provinceError = errors.address_province?.message as string | undefined
  const zipError = errors.address_zip_code?.message as string | undefined
  const datalistId = `${idPrefix}-provinces-list`

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-street`}>
          {streetLabel} {requiredMark && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id={`${idPrefix}-street`}
          autoComplete="street-address"
          placeholder={streetPlaceholder}
          aria-invalid={Boolean(streetError)}
          {...register('address_street' as Path<T>)}
        />
        {streetError && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {streetError}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-barangay`}>
            Barangay {requiredMark && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={`${idPrefix}-barangay`}
            placeholder={requiredMark ? 'Brgy. Loyola Heights' : undefined}
            aria-invalid={Boolean(barangayError)}
            {...register('address_barangay' as Path<T>)}
          />
          {barangayError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {barangayError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-city`}>
            City / Municipality {requiredMark && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={`${idPrefix}-city`}
            autoComplete="address-level2"
            placeholder={requiredMark ? 'Quezon City' : undefined}
            aria-invalid={Boolean(cityError)}
            {...register('address_city' as Path<T>)}
          />
          {cityError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {cityError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-province`}>
            Province {requiredMark && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={`${idPrefix}-province`}
            list={datalistId}
            autoComplete="address-level1"
            placeholder={requiredMark ? 'Metro Manila' : undefined}
            aria-invalid={Boolean(provinceError)}
            {...register('address_province' as Path<T>)}
          />
          <datalist id={datalistId}>
            {PH_PROVINCES.map((prov) => (
              <option key={prov} value={prov} />
            ))}
          </datalist>
          {provinceError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {provinceError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-zip`}>
            {zipLabel} {requiredMark && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={`${idPrefix}-zip`}
            inputMode="numeric"
            maxLength={4}
            autoComplete="postal-code"
            placeholder={requiredMark ? '1108' : undefined}
            aria-invalid={Boolean(zipError)}
            {...register('address_zip_code' as Path<T>)}
          />
          {zipError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {zipError}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
