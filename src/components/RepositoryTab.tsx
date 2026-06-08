/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useTranslation } from "./LanguageContext.tsx";
import DocumentListBlock from "./DocumentListBlock.tsx";

interface RepositoryTabProps {
  currentUser: any;
  dataRevision?: number;
  onDataChange?: () => void;
}

export default function RepositoryTab({ currentUser, dataRevision = 0, onDataChange }: RepositoryTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 selection:bg-primary-100 selection:text-primary-900">
      <div className="border-b border-primary-100 pb-4">
        <h2 className="text-xl page-title">{t("Hujjatlar Ombori (Inventarizatsiya)")}</h2>
        <p className="page-subtitle">
          {t("Faol hujjatlarni tahrirlash, holatini o'zgartirish, elektron PDF almashtirish va o'chirish boshqaruvi")}
        </p>
      </div>

      <DocumentListBlock
        currentUser={currentUser}
        dataRevision={dataRevision}
        onDataChange={onDataChange}
        variant="standalone"
      />
    </div>
  );
}
