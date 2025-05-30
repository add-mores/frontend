'use client'

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SearchParamsHandler({
  onDepartments,
}: {
  onDepartments: (depts: string[]) => void;
}) {
  const searchParams = useSearchParams();
  const departmentsParam = searchParams.get('departments');
  const queryDepts = departmentsParam ? departmentsParam.split(',') : [];

  useEffect(() => {
    onDepartments(queryDepts);
  }, [departmentsParam]);

  return null;
}

