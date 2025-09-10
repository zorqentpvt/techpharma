interface ErrorProps {
    message: string;
  }
  
  export default function Error({ message }: ErrorProps) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        ⚠️ {message}
      </div>
    );
  }
  