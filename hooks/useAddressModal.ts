import { create } from "zustand";

// Define the Zustand store for managing address modal state
const useAddressModal = create((set) => ({
  isOpen: false,
  editAddress: null,
  addressId: null,
  // onOpen sets the modal state and allows for optional address data
  onOpen: (address: { id?: string | null } | null = null) => {
    console.log("Setting modal state in useAddressModal:", address);
    set({ isOpen: true, editAddress: address, addressId: address?.id || null });
  },
  // onClose resets the modal state
  onClose: () => set({ isOpen: false, editAddress: null, addressId: null }),
}));

export default useAddressModal;
