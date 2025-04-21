import { Card } from 'antd';
const ProductCard = (props) => {

    const { product, handleCardClick } = props;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN").format(amount);
    };

    return (
        <Card
            className="bg-[#323232] p-4 text-center transition-all duration-300 hover:shadow-md hover:shadow-neutral-400"
            style={{ width: 280, border: "none", borderRadius: 20, cursor: "pointer" }}
            onClick={handleCardClick}
            cover={
                <div>
                    <img
                        src={product.imageUrl[0]}
                        alt={product.name}
                        className="object-cover w-full h-58 rounded-lg"
                    />
                </div>
            }
        >
            <h3 className="text-white text-base  mt-4">{product.name}</h3>
            <div className='flex gap-2'>
                <p className="text-white text-lg font-bold mt-2">{formatCurrency(product.price)}<sup>₫</sup></p>
                <p className="text-white text-lg mt-2 line-through">{formatCurrency(product.originalPrice)}<sup>₫</sup></p>
            </div>
        </Card>
    );
};

export default ProductCard;
