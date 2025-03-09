import { create } from "zustand";

const useDeleteConfirmModal = create((set) => ({
  isOpen: false,
  itemToDelete: null,
  onOpen: (id: any) => set({ isOpen: true, itemToDelete: id }),
  onClose: () => set({ isOpen: false, itemToDelete: null }),
}));

export default useDeleteConfirmModal;
