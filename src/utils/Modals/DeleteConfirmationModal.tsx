"use client" ;
import { addUserToRedux } from "@/Redux/features/user/userSlice";
import { useAppDispatch } from "@/Redux/hooks";
import { Button } from "@/Components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/Components/ui/dialog";
import auth from "@/utils/firebase.init";
import { useEffect } from "react";
import { useSignOut } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";

type deleteConfirmationModalProps = {
  isModal: boolean;
  setIsModal: (value: boolean) => void;
};

export const DeleteConfirmationModal = ({
  isModal,
  setIsModal,
}: deleteConfirmationModalProps) => {
  const [signOut, loading, error] = useSignOut(auth);

  const dispatch = useAppDispatch() ; 

  //   -- closing modal and logging out
  const handleModalClose = async () => {
    const success = await signOut();   
    if (success) {
      toast.success(`Logged out successfully !`, { position: "bottom-center" });
      dispatch(addUserToRedux('')) ;
    }
    setIsModal(false);
  };

  useEffect(() => {
    if (error) {
        toast.error(error?.message || "An error happened while logging out !");
    }
  }, [loading, error]);
  return (
    <Dialog open={isModal} onOpenChange={setIsModal}>
      <DialogContent>
        <DialogHeader></DialogHeader>
        <DialogContent>
          <p className="text-2xl font-semibold text-center py-8">
            Want to Log out ?
          </p>
          <div className="flex justify-center items-center gap-4">
            <Button style={{ backgroundColor: 'orange', color : 'black' }}  onClick={handleModalClose} >
              Logout
            </Button>
            <Button className="" onClick={() => setIsModal(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>

        {/* <DialogClose asChild>
        </DialogClose> */}
      </DialogContent>
    </Dialog>
  );
};
