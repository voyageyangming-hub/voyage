'use client'

import { createContext, useContext } from 'react'

export const AdminPwdContext = createContext('')
export const useAdminPwd = () => useContext(AdminPwdContext)
